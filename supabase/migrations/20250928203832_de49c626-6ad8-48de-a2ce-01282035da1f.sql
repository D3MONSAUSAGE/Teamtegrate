-- Fix create_inventory_transaction_from_receipt_line function to remove generated column total_cost
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
    w.organization_id,
    wr.vendor_name,
    wr.received_at,
    wr.posted_by
  INTO receipt_line_record
  FROM warehouse_receipt_lines wrl
  JOIN warehouse_receipts wr ON wrl.receipt_id = wr.id
  JOIN warehouses w ON wr.warehouse_id = w.id
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
  
  -- Create inventory transaction WITHOUT total_cost (it's generated)
  INSERT INTO inventory_transactions (
    organization_id,
    item_id,
    warehouse_id,
    transaction_type,
    quantity,
    unit_cost,
    transaction_date,
    reference_number,
    receipt_line_id,
    notes,
    user_id,
    created_by,
    vendor_name,
    po_number
  ) VALUES (
    receipt_line_record.organization_id,
    receipt_line_record.item_id,
    receipt_line_record.warehouse_id,
    'receipt',
    receipt_line_record.qty,
    receipt_line_record.unit_cost,
    COALESCE(receipt_line_record.received_at, NOW()),
    'WR-' || receipt_line_record.receipt_id::text,
    p_receipt_line_id,
    'Inventory received from vendor: ' || COALESCE(receipt_line_record.vendor_name, 'Unknown'),
    COALESCE(receipt_line_record.posted_by, auth.uid()),
    COALESCE(receipt_line_record.posted_by, auth.uid()),
    receipt_line_record.vendor_name,
    null
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
    receipt_line_record.qty,
    receipt_line_record.unit_cost,
    receipt_line_record.qty * receipt_line_record.unit_cost,
    NOW(),
    COALESCE(item_record.minimum_quantity, 0),
    COALESCE(item_record.maximum_quantity, 0)
  )
  ON CONFLICT (organization_id, item_id, warehouse_id)
  DO UPDATE SET
    current_stock = inventory_warehouse_items.current_stock + receipt_line_record.qty,
    unit_cost = CASE 
      WHEN inventory_warehouse_items.current_stock + receipt_line_record.qty > 0
      THEN (inventory_warehouse_items.total_value + (receipt_line_record.qty * receipt_line_record.unit_cost)) / 
           (inventory_warehouse_items.current_stock + receipt_line_record.qty)
      ELSE receipt_line_record.unit_cost
    END,
    total_value = inventory_warehouse_items.total_value + (receipt_line_record.qty * receipt_line_record.unit_cost),
    last_updated = NOW();
    
END;
$$;