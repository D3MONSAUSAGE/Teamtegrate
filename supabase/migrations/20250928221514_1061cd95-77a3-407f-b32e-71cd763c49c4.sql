-- Fix the post_warehouse_receipt function with correct schema
CREATE OR REPLACE FUNCTION post_warehouse_receipt(receipt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  receipt_record RECORD;
  item_record RECORD;
  current_user_id uuid;
  current_org_id uuid;
  result jsonb;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  current_org_id := get_current_user_organization_id();
  
  -- Get the receipt details
  SELECT * INTO receipt_record
  FROM warehouse_receipts
  WHERE id = receipt_id AND status = 'draft';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Receipt not found or already posted');
  END IF;
  
  -- Update receipt status to posted
  UPDATE warehouse_receipts
  SET status = 'posted', posted_at = now()
  WHERE id = receipt_id;
  
  -- Process each receipt line (not receipt_items)
  FOR item_record IN
    SELECT * FROM warehouse_receipt_lines WHERE receipt_id = receipt_id
  LOOP
    -- Insert or update warehouse_items (using correct columns)
    INSERT INTO warehouse_items (
      warehouse_id,
      item_id,
      on_hand,
      sale_price
    )
    VALUES (
      receipt_record.warehouse_id,
      item_record.item_id,
      item_record.qty,
      COALESCE(item_record.unit_cost, 0)
    )
    ON CONFLICT (warehouse_id, item_id)
    DO UPDATE SET
      on_hand = warehouse_items.on_hand + EXCLUDED.on_hand;
    
    -- Create inventory transaction record (with required fields)
    INSERT INTO inventory_transactions (
      item_id,
      warehouse_id,
      transaction_type,
      quantity,
      unit_cost,
      reference_number,
      notes,
      transaction_date,
      created_by,
      user_id,
      team_id,
      organization_id,
      created_at
    )
    VALUES (
      item_record.item_id,
      receipt_record.warehouse_id,
      'receipt',
      item_record.qty,
      COALESCE(item_record.unit_cost, 0),
      receipt_record.receipt_number,
      'Warehouse receipt posted',
      receipt_record.received_date,
      current_user_id,
      current_user_id,
      receipt_record.team_id,
      current_org_id,
      now()
    );
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'message', 'Receipt posted successfully');
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;