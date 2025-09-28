-- Fix the process_warehouse_receipt_posting function with correct field mappings
CREATE OR REPLACE FUNCTION public.process_warehouse_receipt_posting(receipt_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  receipt_record RECORD;
  warehouse_record RECORD;
  line_record RECORD;
  item_record RECORD;
  result_data jsonb := '{}';
  total_lines integer := 0;
  processed_lines integer := 0;
BEGIN
  -- Get receipt details with warehouse info (to get team_id)
  SELECT wr.*, w.team_id as warehouse_team_id
  INTO receipt_record
  FROM warehouse_receipts wr
  JOIN warehouses w ON wr.warehouse_id = w.id
  WHERE wr.id = receipt_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Receipt not found'
    );
  END IF;
  
  -- Check if receipt is in draft status
  IF receipt_record.status != 'draft' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only draft receipts can be posted'
    );
  END IF;
  
  -- Count total lines for progress tracking
  SELECT COUNT(*) INTO total_lines
  FROM warehouse_receipt_lines 
  WHERE receipt_id = receipt_id_param;
  
  -- Process each receipt line
  FOR line_record IN 
    SELECT wrl.*, ii.name as item_name, ii.sku, ii.barcode
    FROM warehouse_receipt_lines wrl
    JOIN inventory_items ii ON wrl.item_id = ii.id
    WHERE wrl.receipt_id = receipt_id_param
  LOOP
    processed_lines := processed_lines + 1;
    
    -- Create inventory transaction using correct schema fields
    INSERT INTO inventory_transactions (
      organization_id,
      team_id,
      item_id,
      warehouse_id,
      transaction_type,
      quantity,
      unit_cost,
      total_cost,
      transaction_date,
      notes,
      reference_number,
      receipt_line_id,
      user_id  -- Use user_id instead of created_by
    ) VALUES (
      receipt_record.organization_id,
      receipt_record.warehouse_team_id,  -- Get team_id from warehouse
      line_record.item_id,
      receipt_record.warehouse_id,
      'in', -- Use 'in' transaction type
      line_record.quantity_received,
      line_record.unit_cost,
      line_record.quantity_received * line_record.unit_cost,
      COALESCE(receipt_record.received_at, receipt_record.created_at)::date, -- Use received_at or fallback to created_at
      'Warehouse receipt: ' || receipt_record.receipt_number,
      receipt_record.receipt_number,
      line_record.id,
      receipt_record.created_by  -- Map created_by to user_id
    );
    
    -- Update or insert warehouse inventory
    INSERT INTO warehouse_inventory (
      organization_id,
      warehouse_id,
      item_id,
      quantity_on_hand,
      unit_cost,
      total_value,
      last_updated,
      created_by
    ) VALUES (
      receipt_record.organization_id,
      receipt_record.warehouse_id,
      line_record.item_id,
      line_record.quantity_received,
      line_record.unit_cost,
      line_record.quantity_received * line_record.unit_cost,
      now(),
      receipt_record.created_by
    )
    ON CONFLICT (warehouse_id, item_id)
    DO UPDATE SET
      quantity_on_hand = warehouse_inventory.quantity_on_hand + line_record.quantity_received,
      unit_cost = line_record.unit_cost,
      total_value = warehouse_inventory.total_value + (line_record.quantity_received * line_record.unit_cost),
      last_updated = now();
  END LOOP;
  
  -- Update receipt status to posted
  UPDATE warehouse_receipts 
  SET 
    status = 'posted',
    posted_at = now(),
    updated_at = now()
  WHERE id = receipt_id_param;
  
  -- Build result
  result_data := jsonb_build_object(
    'success', true,
    'receipt_id', receipt_id_param,
    'total_lines', total_lines,
    'processed_lines', processed_lines,
    'posted_at', now()
  );
  
  RETURN result_data;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'details', SQLSTATE
  );
END;
$function$;