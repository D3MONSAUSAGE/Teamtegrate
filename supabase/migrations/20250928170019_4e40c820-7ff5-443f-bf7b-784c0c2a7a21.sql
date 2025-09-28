-- Fix the trigger function to use correct transaction_type ('in' instead of 'receipt')
CREATE OR REPLACE FUNCTION create_inventory_transaction_from_receipt_line(
  receipt_line_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  line_record RECORD;
BEGIN
  -- Get the receipt line details with joins
  SELECT 
    wrl.id,
    wrl.item_id,
    wrl.qty,
    wrl.unit_cost,
    wr.warehouse_id,
    wr.vendor_name,
    wr.vendor_invoice,
    wr.posted_at,
    wr.posted_by,
    w.team_id,
    w.organization_id
  INTO line_record
  FROM warehouse_receipt_lines wrl
  JOIN warehouse_receipts wr ON wrl.receipt_id = wr.id
  JOIN warehouses w ON wr.warehouse_id = w.id
  WHERE wrl.id = receipt_line_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Create corresponding inventory transaction
  INSERT INTO inventory_transactions (
    organization_id,
    team_id,
    item_id,
    transaction_type,
    quantity,
    unit_cost,
    transaction_date,
    notes,
    po_number,
    vendor_name,
    created_by,
    warehouse_id,
    receipt_line_id,
    user_id
  ) VALUES (
    line_record.organization_id,
    line_record.team_id,
    line_record.item_id,
    'in', -- Use 'in' instead of 'receipt'
    line_record.qty,
    line_record.unit_cost,
    COALESCE(line_record.posted_at, now()),
    'Auto-generated from warehouse receipt',
    line_record.vendor_invoice,
    line_record.vendor_name,
    line_record.posted_by,
    line_record.warehouse_id,
    line_record.id,
    line_record.posted_by
  )
  ON CONFLICT (receipt_line_id) DO NOTHING;
END;
$$;

-- Now create inventory transactions for existing posted receipts (using 'in' transaction_type)
INSERT INTO inventory_transactions (
  organization_id,
  team_id,
  item_id,
  transaction_type,
  quantity,
  unit_cost,
  transaction_date,
  notes,
  po_number,
  vendor_name,
  created_by,
  warehouse_id,
  receipt_line_id,
  user_id,
  created_at
)
SELECT 
  w.organization_id,
  w.team_id,
  wrl.item_id,
  'in' as transaction_type, -- Use 'in' instead of 'receipt'
  wrl.qty,
  wrl.unit_cost,
  COALESCE(wr.posted_at, wr.received_at, wr.created_at),
  'Retroactively created from existing warehouse receipt',
  wr.vendor_invoice,
  wr.vendor_name,
  wr.posted_by,
  wr.warehouse_id,
  wrl.id,
  wr.posted_by,
  wr.created_at
FROM warehouse_receipt_lines wrl
JOIN warehouse_receipts wr ON wrl.receipt_id = wr.id
JOIN warehouses w ON wr.warehouse_id = w.id
WHERE wr.status = 'posted'
  AND wr.posted_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM inventory_transactions it 
    WHERE it.receipt_line_id = wrl.id
  )
ON CONFLICT (receipt_line_id) DO NOTHING;