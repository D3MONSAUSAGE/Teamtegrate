-- Drop ALL existing post_warehouse_receipt function overloads to eliminate ambiguity
DROP FUNCTION IF EXISTS public.post_warehouse_receipt(uuid, text);
DROP FUNCTION IF EXISTS public.post_warehouse_receipt(uuid, uuid);
DROP FUNCTION IF EXISTS public.post_warehouse_receipt(uuid, jsonb);

-- Create exactly ONE function with signature that matches client call
CREATE OR REPLACE FUNCTION public.post_warehouse_receipt(
  p_receipt_id uuid,
  p_user text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wh_id  uuid;
  v_now    timestamptz := now();
  v_summary jsonb;
  v_user_uuid uuid;
BEGIN
  -- Convert text user to uuid if needed
  BEGIN
    v_user_uuid := p_user::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid user ID format: %', p_user;
  END;

  -- Must be draft
  PERFORM 1 FROM warehouse_receipts r
   WHERE r.id = p_receipt_id AND r.status = 'draft';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt % not found or not draft', p_receipt_id;
  END IF;

  SELECT warehouse_id INTO v_wh_id
  FROM warehouse_receipts WHERE id = p_receipt_id;

  -- Aggregate lines and bump stock (simple add)
  WITH agg AS (
    SELECT item_id, SUM(qty)::numeric AS qty, COALESCE(MAX(unit_cost),0)::numeric AS last_cost
    FROM warehouse_receipt_lines
    WHERE receipt_id = p_receipt_id
    GROUP BY item_id
  )
  INSERT INTO warehouse_items AS wi
        (warehouse_id, item_id, on_hand, sale_price, updated_at, organization_id)
  SELECT v_wh_id, a.item_id, a.qty, a.last_cost, v_now, get_current_user_organization_id()
    FROM agg a
  ON CONFLICT (warehouse_id, item_id)
  DO UPDATE SET
    on_hand    = wi.on_hand + EXCLUDED.on_hand,
    sale_price = EXCLUDED.sale_price,
    updated_at = v_now;

  -- Mark receipt as posted
  UPDATE warehouse_receipts
     SET status='posted', posted_at=v_now, received_at=COALESCE(received_at, v_now), updated_at=v_now
   WHERE id = p_receipt_id;

  UPDATE warehouse_receipt_lines SET posted_at=v_now WHERE receipt_id = p_receipt_id;

  SELECT jsonb_build_object(
           'success', true,
           'receipt_id', r.id,
           'warehouse_id', r.warehouse_id,
           'posted_at', r.posted_at,
           'message', 'Receipt posted successfully')
    INTO v_summary
  FROM warehouse_receipts r WHERE r.id = p_receipt_id;

  RETURN v_summary;
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_warehouse_receipt(uuid, text) TO authenticated;

-- Ensure the upsert key exists
CREATE UNIQUE INDEX IF NOT EXISTS uq_warehouse_items_wh_item
  ON public.warehouse_items(warehouse_id, item_id);