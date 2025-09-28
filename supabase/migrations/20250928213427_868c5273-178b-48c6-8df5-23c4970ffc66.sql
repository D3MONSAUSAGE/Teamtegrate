-- Purpose: eliminate "inventory_warehouse_items does not exist" by:
-- (A) creating a compatibility view named inventory_warehouse_items -> warehouse_items
-- (B) recreating post_warehouse_receipt to only use warehouse_items (not the alias)
-- Safe & idempotent.

BEGIN;

-- A) Compatibility view: old name -> new table
-- If the view already exists, replace it; if the table exists under the old name, do nothing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r','p')                 -- real table/partition
      AND n.nspname = 'public'
      AND c.relname = 'inventory_warehouse_items'
  ) THEN
    -- Not a real table—(re)create a view aliasing to the correct table
    EXECUTE 'CREATE OR REPLACE VIEW public.inventory_warehouse_items AS SELECT * FROM public.warehouse_items';
  END IF;
END$$;

-- B) Recreate the RPC to reference ONLY public.warehouse_items
DROP FUNCTION IF EXISTS public.post_warehouse_receipt(uuid, text);

CREATE OR REPLACE FUNCTION public.post_warehouse_receipt(
  p_receipt_id uuid,
  p_user       text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  -- Mark receipt posted (only from draft)
  UPDATE public.warehouse_receipts
     SET status = 'posted',
         posted_at = COALESCE(posted_at, now()),
         posted_by = COALESCE(posted_by, p_user::uuid)
   WHERE id = p_receipt_id
     AND status = 'draft';

  -- Upsert quantities into the REAL table (public.warehouse_items)
  FOR r IN
    SELECT wr.warehouse_id, wrl.item_id, wrl.qty, wrl.unit_cost
    FROM public.warehouse_receipts wr
    JOIN public.warehouse_receipt_lines wrl ON wrl.receipt_id = wr.id
    WHERE wr.id = p_receipt_id
  LOOP
    INSERT INTO public.warehouse_items AS wi
      (warehouse_id, item_id, on_hand, sale_price, organization_id)
    VALUES
      (r.warehouse_id, r.item_id, r.qty, r.unit_cost,
       (SELECT organization_id FROM public.warehouse_receipts WHERE id = p_receipt_id))
    ON CONFLICT (warehouse_id, item_id) DO UPDATE
      SET on_hand    = wi.on_hand + EXCLUDED.on_hand,
          sale_price = EXCLUDED.sale_price,
          updated_at = now();
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message', 'Receipt posted');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'code', SQLSTATE);
END;
$$;

-- Make sure app role can execute
GRANT EXECUTE ON FUNCTION public.post_warehouse_receipt(uuid, text) TO authenticated;

COMMIT;