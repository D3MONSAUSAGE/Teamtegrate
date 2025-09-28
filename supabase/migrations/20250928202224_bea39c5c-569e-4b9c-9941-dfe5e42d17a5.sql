-- Drop and recreate function to fix ambiguous column reference
DROP FUNCTION IF EXISTS create_inventory_transaction_from_receipt_line(uuid);

CREATE OR REPLACE FUNCTION create_inventory_transaction_from_receipt_line(
  p_receipt_line_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  receipt_line_record RECORD;
  item_record RECORD;
  warehouse_record RECORD;
BEGIN
  -- Get receipt line details with joins
  SELECT 
    wrl.*,
    wr.warehouse_id,
    wr.organization_id,
    wr.supplier_id,
    wr.received_date
  INTO receipt_line_record
  FROM warehouse_receipt_lines wrl
  JOIN warehouse_receipts wr ON wrl.receipt_id = wr.id
  WHERE wrl.id = p_receipt_line_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receipt line not found: %', p_receipt_line_id;
  END IF;
  
  -- Get item details
  SELECT * INTO item_record
  FROM inventory_items
  WHERE id = receipt_line_record.item_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found: %', receipt_line_record.item_id;
  END IF;
  
  -- Get warehouse details
  SELECT * INTO warehouse_record
  FROM warehouses
  WHERE id = receipt_line_record.warehouse_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Warehouse not found: %', receipt_line_record.warehouse_id;
  END IF;
  
  -- Create inventory transaction
  INSERT INTO inventory_transactions (
    organization_id,
    item_id,
    warehouse_id,
    transaction_type,
    quantity,
    unit_cost,
    total_cost,
    transaction_date,
    reference_type,
    reference_id,
    notes,
    created_by
  ) VALUES (
    receipt_line_record.organization_id,
    receipt_line_record.item_id,
    receipt_line_record.warehouse_id,
    'receipt',
    receipt_line_record.quantity_received,
    receipt_line_record.unit_cost,
    receipt_line_record.quantity_received * receipt_line_record.unit_cost,
    receipt_line_record.received_date,
    'warehouse_receipt_line',
    p_receipt_line_id,
    'Inventory received from supplier: ' || COALESCE(receipt_line_record.supplier_id::text, 'Unknown'),
    auth.uid()
  );
  
  -- Update or insert warehouse item stock levels
  INSERT INTO inventory_warehouse_items (
    organization_id,
    item_id,
    warehouse_id,
    current_stock,
    unit_cost,
    total_value,
    last_updated,
    reorder_point,
    max_stock_level
  ) VALUES (
    receipt_line_record.organization_id,
    receipt_line_record.item_id,
    receipt_line_record.warehouse_id,
    receipt_line_record.quantity_received,
    receipt_line_record.unit_cost,
    receipt_line_record.quantity_received * receipt_line_record.unit_cost,
    NOW(),
    COALESCE(item_record.minimum_quantity, 0),
    COALESCE(item_record.maximum_quantity, 0)
  )
  ON CONFLICT (organization_id, item_id, warehouse_id)
  DO UPDATE SET
    current_stock = inventory_warehouse_items.current_stock + receipt_line_record.quantity_received,
    unit_cost = CASE 
      WHEN inventory_warehouse_items.current_stock + receipt_line_record.quantity_received > 0
      THEN (inventory_warehouse_items.total_value + (receipt_line_record.quantity_received * receipt_line_record.unit_cost)) / 
           (inventory_warehouse_items.current_stock + receipt_line_record.quantity_received)
      ELSE receipt_line_record.unit_cost
    END,
    total_value = inventory_warehouse_items.total_value + (receipt_line_record.quantity_received * receipt_line_record.unit_cost),
    last_updated = NOW();
    
END;
$$;