-- Remove the conflicting old function and fix the new one with correct schema
DROP FUNCTION IF EXISTS post_warehouse_receipt(p_receipt_id uuid, p_user text);

-- Fix the main function with correct field references
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
  
  -- Update receipt status to posted with proper fields
  UPDATE warehouse_receipts
  SET status = 'posted', 
      posted_at = now(),
      posted_by = current_user_id,
      received_at = COALESCE(received_at, now())
  WHERE id = receipt_id;
  
  -- Process each receipt line
  FOR item_record IN
    SELECT * FROM warehouse_receipt_lines WHERE receipt_id = receipt_id
  LOOP
    -- Insert or update warehouse_items (remove organization_id - doesn't exist)
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
    
    -- Create inventory transaction record (use receipt ID as reference)
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
      receipt_record.id::text, -- Use receipt ID instead of non-existent receipt_number
      'Warehouse receipt posted - ' || COALESCE(receipt_record.vendor_name, 'Unknown vendor'),
      COALESCE(receipt_record.received_at, now()), -- Use received_at instead of received_date
      current_user_id,
      current_user_id,
      receipt_record.warehouse_id, -- Use warehouse_id as team_id if needed
      current_org_id,
      now()
    );
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'message', 'Receipt posted successfully');
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;