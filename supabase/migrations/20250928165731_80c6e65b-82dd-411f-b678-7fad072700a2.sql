-- Fix warehouse reporting by updating inventory_transactions schema and creating proper functions

-- 1. Add missing columns to inventory_transactions table
ALTER TABLE inventory_transactions 
ADD COLUMN IF NOT EXISTS total_cost numeric GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED;

ALTER TABLE inventory_transactions 
ADD COLUMN IF NOT EXISTS po_number text;

ALTER TABLE inventory_transactions 
ADD COLUMN IF NOT EXISTS vendor_name text;

ALTER TABLE inventory_transactions 
ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE inventory_transactions 
ADD COLUMN IF NOT EXISTS warehouse_id uuid REFERENCES warehouses(id);

ALTER TABLE inventory_transactions 
ADD COLUMN IF NOT EXISTS receipt_line_id uuid REFERENCES warehouse_receipt_lines(id);

-- Add unique constraint to prevent duplicate transactions per receipt line
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_receipt_line_transaction'
  ) THEN
    ALTER TABLE inventory_transactions 
    ADD CONSTRAINT unique_receipt_line_transaction 
    UNIQUE (receipt_line_id);
  END IF;
END $$;

-- 2. Create function to generate inventory transactions from warehouse receipts
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
    wrl.quantity_received,
    wrl.unit_cost,
    wrl.po_number,
    wr.warehouse_id,
    wr.vendor_name,
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
    'receipt',
    line_record.quantity_received,
    line_record.unit_cost,
    COALESCE(line_record.posted_at, now()),
    'Auto-generated from warehouse receipt',
    line_record.po_number,
    line_record.vendor_name,
    line_record.posted_by,
    line_record.warehouse_id,
    line_record.id,
    line_record.posted_by -- user_id is required, use posted_by
  )
  ON CONFLICT (receipt_line_id) DO NOTHING; -- Prevent duplicates
END;
$$;

-- 3. Create trigger function
CREATE OR REPLACE FUNCTION trigger_create_inventory_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create transactions when receipt is posted
  IF NEW.status = 'posted' AND (OLD.status IS NULL OR OLD.status != 'posted') THEN
    -- Create inventory transactions for all lines in this receipt
    PERFORM create_inventory_transaction_from_receipt_line(wrl.id)
    FROM warehouse_receipt_lines wrl
    WHERE wrl.receipt_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS after_warehouse_receipt_posted ON warehouse_receipts;

CREATE TRIGGER after_warehouse_receipt_posted
  AFTER UPDATE ON warehouse_receipts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_inventory_transactions();

-- 4. Create warehouse-specific reporting function
CREATE OR REPLACE FUNCTION get_warehouse_daily_movements(
  p_warehouse_id uuid DEFAULT NULL,
  p_date date DEFAULT CURRENT_DATE
) RETURNS TABLE (
  transaction_type text,
  transaction_count bigint,
  total_quantity numeric,
  total_value numeric,
  po_numbers text[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.transaction_type,
    COUNT(*)::bigint as transaction_count,
    COALESCE(SUM(it.quantity), 0) as total_quantity,
    COALESCE(SUM(it.total_cost), 0) as total_value,
    ARRAY_AGG(DISTINCT it.po_number) FILTER (WHERE it.po_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  WHERE (p_warehouse_id IS NULL OR it.warehouse_id = p_warehouse_id)
    AND DATE(it.transaction_date) = p_date
    AND it.organization_id = get_current_user_organization_id()
  GROUP BY it.transaction_type
  ORDER BY total_value DESC;
END;
$$;

-- 5. Create warehouse inventory value function
CREATE OR REPLACE FUNCTION get_warehouse_inventory_value(
  p_warehouse_id uuid DEFAULT NULL
) RETURNS TABLE (
  warehouse_id uuid,
  warehouse_name text,
  total_value numeric,
  total_items bigint,
  low_stock_count bigint,
  overstock_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as warehouse_id,
    w.name as warehouse_name,
    COALESCE(SUM(wi.quantity * wi.unit_cost), 0) as total_value,
    COUNT(wi.id)::bigint as total_items,
    COUNT(CASE WHEN wi.quantity <= wi.reorder_point THEN 1 END)::bigint as low_stock_count,
    COUNT(CASE WHEN wi.quantity >= wi.max_stock_level THEN 1 END)::bigint as overstock_count
  FROM warehouses w
  LEFT JOIN inventory_warehouse_items wi ON w.id = wi.warehouse_id
  WHERE w.organization_id = get_current_user_organization_id()
    AND (p_warehouse_id IS NULL OR w.id = p_warehouse_id)
    AND w.is_active = true
  GROUP BY w.id, w.name
  ORDER BY total_value DESC;
END;
$$;

-- 6. Update existing reporting function to include warehouse data
CREATE OR REPLACE FUNCTION get_daily_movements(
  p_date date DEFAULT CURRENT_DATE,
  p_team_id uuid DEFAULT NULL,
  p_warehouse_id uuid DEFAULT NULL
) RETURNS TABLE (
  transaction_type text,
  transaction_count bigint,
  total_quantity numeric,
  total_value numeric,
  po_numbers text[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.transaction_type,
    COUNT(*)::bigint as transaction_count,
    COALESCE(SUM(it.quantity), 0) as total_quantity,
    COALESCE(SUM(it.total_cost), 0) as total_value,
    ARRAY_AGG(DISTINCT it.po_number) FILTER (WHERE it.po_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  WHERE DATE(it.transaction_date) = p_date
    AND it.organization_id = get_current_user_organization_id()
    AND (p_team_id IS NULL OR it.team_id = p_team_id)
    AND (p_warehouse_id IS NULL OR it.warehouse_id = p_warehouse_id)
  GROUP BY it.transaction_type
  ORDER BY total_value DESC;
END;
$$;