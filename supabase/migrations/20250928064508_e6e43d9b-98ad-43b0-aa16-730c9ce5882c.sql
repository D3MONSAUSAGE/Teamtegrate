-- Drop ALL versions of post_warehouse_receipt function
DROP FUNCTION IF EXISTS public.post_warehouse_receipt(uuid, text);
DROP FUNCTION IF EXISTS public.post_warehouse_receipt(uuid, jsonb);

-- Create the correct function with the right signature that the client is calling
CREATE OR REPLACE FUNCTION public.post_warehouse_receipt(
  p_receipt_id uuid,
  p_user text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  cur_on_hand numeric;
BEGIN
  -- Get user's organization
  IF get_current_user_organization_id() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated or no organization');
  END IF;

  -- Update receipt status
  UPDATE public.warehouse_receipts
  SET status='posted', received_at=COALESCE(received_at, now())
  WHERE id=p_receipt_id AND status='draft';

  -- Process each receipt line
  FOR r IN
    SELECT wr.warehouse_id, wrl.item_id, wrl.qty, wrl.unit_cost
    FROM public.warehouse_receipts wr
    JOIN public.warehouse_receipt_lines wrl ON wrl.receipt_id = wr.id
    WHERE wr.id = p_receipt_id
  LOOP
    -- Get current stock (no WAC needed)
    SELECT on_hand INTO cur_on_hand
    FROM public.inventory_warehouse_items
    WHERE warehouse_id=r.warehouse_id AND item_id=r.item_id
    FOR UPDATE;

    IF NOT FOUND THEN
      -- Insert new warehouse item (use sale_price instead of wac_unit_cost)
      INSERT INTO public.inventory_warehouse_items(
        warehouse_id, 
        item_id, 
        on_hand, 
        sale_price,
        organization_id
      )
      VALUES (
        r.warehouse_id, 
        r.item_id, 
        r.qty, 
        r.unit_cost,
        get_current_user_organization_id()
      );
    ELSE
      -- Update existing warehouse item (simple quantity addition)
      UPDATE public.inventory_warehouse_items
      SET 
        on_hand = on_hand + r.qty,
        sale_price = r.unit_cost,
        updated_at = NOW()
      WHERE warehouse_id=r.warehouse_id AND item_id=r.item_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'message', 'Receipt posted successfully');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;