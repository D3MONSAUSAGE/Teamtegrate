-- Add transaction integration for warehouse operations (corrected)

-- 1. Create function to handle stock withdrawals with transaction tracking
CREATE OR REPLACE FUNCTION public.create_warehouse_withdrawal(
  p_warehouse_id uuid,
  p_item_id uuid,
  p_quantity numeric,
  p_reason text DEFAULT 'Stock withdrawal',
  p_reference text DEFAULT NULL
) 
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  transaction_id uuid;
  current_stock numeric;
  unit_cost numeric;
  org_id uuid;
  team_id uuid;
BEGIN
  -- Get warehouse info and current stock separately
  SELECT w.organization_id, t.id, wi.on_hand
  INTO org_id, team_id, current_stock
  FROM warehouses w
  JOIN teams t ON w.team_id = t.id
  JOIN warehouse_items wi ON wi.warehouse_id = w.id AND wi.item_id = p_item_id
  WHERE w.id = p_warehouse_id;
  
  -- Check if enough stock
  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', current_stock, p_quantity;
  END IF;
  
  -- Get latest unit cost from receipts
  SELECT COALESCE(wrl.unit_cost, 0) INTO unit_cost
  FROM warehouse_receipt_lines wrl
  JOIN warehouse_receipts wr ON wrl.receipt_id = wr.id
  WHERE wrl.item_id = p_item_id 
    AND wr.status = 'posted'
  ORDER BY wrl.posted_at DESC
  LIMIT 1;
  
  -- Create withdrawal transaction
  INSERT INTO inventory_transactions (
    organization_id,
    team_id,
    item_id,
    transaction_type,
    quantity,
    unit_cost,
    transaction_date,
    reference_number,
    notes,
    user_id
  ) VALUES (
    org_id,
    team_id,
    p_item_id,
    'out',
    -p_quantity,
    COALESCE(unit_cost, 0),
    CURRENT_DATE,
    p_reference,
    p_reason,
    auth.uid()
  ) RETURNING id INTO transaction_id;
  
  -- Update warehouse stock
  UPDATE warehouse_items 
  SET on_hand = on_hand - p_quantity
  WHERE warehouse_id = p_warehouse_id AND item_id = p_item_id;
  
  RETURN transaction_id;
END;
$$;

-- 2. Create function to automatically create inventory transactions from warehouse receipts
CREATE OR REPLACE FUNCTION public.create_transaction_from_receipt_posting()
RETURNS TRIGGER AS $$
DECLARE
  org_id uuid;
  team_id uuid;
  line_record RECORD;
BEGIN
  -- Only process when receipt is being posted (status changes to 'posted')
  IF NEW.status = 'posted' AND OLD.status != 'posted' THEN
    -- Get organization and team info
    SELECT w.organization_id, t.id 
    INTO org_id, team_id
    FROM warehouses w
    JOIN teams t ON w.team_id = t.id
    WHERE w.id = NEW.warehouse_id;
    
    -- Create inventory transactions for each receipt line
    FOR line_record IN 
      SELECT * FROM warehouse_receipt_lines 
      WHERE receipt_id = NEW.id
    LOOP
      INSERT INTO inventory_transactions (
        organization_id,
        team_id,
        item_id,
        transaction_type,
        quantity,
        unit_cost,
        transaction_date,
        reference_number,
        notes,
        user_id
      ) VALUES (
        org_id,
        team_id,
        line_record.item_id,
        'in',
        line_record.qty,
        line_record.unit_cost,
        COALESCE(NEW.received_at, NEW.created_at),
        NEW.vendor_invoice,
        'Warehouse receipt: ' || COALESCE(NEW.notes, ''),
        COALESCE(NEW.posted_by, NEW.created_by)
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for warehouse receipt posting
DROP TRIGGER IF EXISTS create_transactions_on_receipt_posting ON warehouse_receipts;
CREATE TRIGGER create_transactions_on_receipt_posting
  AFTER UPDATE ON warehouse_receipts
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_from_receipt_posting();