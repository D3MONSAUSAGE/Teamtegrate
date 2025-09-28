-- Fix the post_warehouse_receipt function by removing organization_id references
CREATE OR REPLACE FUNCTION post_warehouse_receipt(receipt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  receipt_record RECORD;
  item_record RECORD;
  result jsonb;
BEGIN
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
  
  -- Process each receipt item
  FOR item_record IN
    SELECT * FROM warehouse_receipt_items WHERE receipt_id = receipt_id
  LOOP
    -- Insert or update warehouse_items (stock)
    INSERT INTO warehouse_items (
      warehouse_id,
      item_id,
      quantity,
      unit_cost,
      location,
      lot_number,
      expiry_date,
      created_at,
      updated_at
    )
    VALUES (
      receipt_record.warehouse_id,
      item_record.item_id,
      item_record.quantity_received,
      item_record.unit_cost,
      item_record.location,
      item_record.lot_number,
      item_record.expiry_date,
      now(),
      now()
    )
    ON CONFLICT (warehouse_id, item_id, COALESCE(lot_number, ''))
    DO UPDATE SET
      quantity = warehouse_items.quantity + EXCLUDED.quantity,
      unit_cost = EXCLUDED.unit_cost,
      updated_at = now();
    
    -- Create inventory transaction record
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
      created_at
    )
    VALUES (
      item_record.item_id,
      receipt_record.warehouse_id,
      'receipt',
      item_record.quantity_received,
      item_record.unit_cost,
      receipt_record.receipt_number,
      'Warehouse receipt posted',
      receipt_record.received_date,
      receipt_record.received_by,
      now()
    );
  END LOOP;
  
  RETURN jsonb_build_object('success', true, 'message', 'Receipt posted successfully');
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;