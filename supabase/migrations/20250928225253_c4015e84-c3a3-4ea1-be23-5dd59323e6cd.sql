-- Phase 1: Complete Warehouse Receiving System Rebuild (Corrected)
-- Fix schema to match existing tables and add missing columns

-- Add missing columns to warehouse_receipts
ALTER TABLE public.warehouse_receipts 
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- Set organization_id based on warehouse relationship for existing records
UPDATE public.warehouse_receipts 
SET organization_id = w.organization_id
FROM warehouses w
WHERE warehouse_receipts.warehouse_id = w.id
AND warehouse_receipts.organization_id IS NULL;

-- Make organization_id NOT NULL after populating
ALTER TABLE public.warehouse_receipts 
ALTER COLUMN organization_id SET NOT NULL;

-- Add missing columns to warehouse_receipt_lines
ALTER TABLE public.warehouse_receipt_lines 
ADD COLUMN IF NOT EXISTS quantity_expected DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantity_received DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migrate existing qty data to new columns
UPDATE public.warehouse_receipt_lines
SET 
  quantity_expected = qty,
  quantity_received = qty
WHERE quantity_received IS NULL;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_warehouse_receipts_organization_status 
ON public.warehouse_receipts(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_warehouse_receipt_lines_receipt_id 
ON public.warehouse_receipt_lines(receipt_id);

CREATE INDEX IF NOT EXISTS idx_warehouse_receipt_lines_item_id 
ON public.warehouse_receipt_lines(item_id);

-- Create new simplified receipt posting function
CREATE OR REPLACE FUNCTION public.process_warehouse_receipt_posting(receipt_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  receipt_record RECORD;
  line_record RECORD;
  current_org_id UUID;
  total_lines INTEGER := 0;
  processed_lines INTEGER := 0;
  result JSONB;
BEGIN
  -- Get current user's organization
  current_org_id := get_current_user_organization_id();
  
  -- Validate receipt exists and belongs to user's organization
  SELECT * INTO receipt_record 
  FROM warehouse_receipts 
  WHERE id = receipt_id_param 
    AND organization_id = current_org_id
    AND status = 'draft';
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Receipt not found or already posted'
    );
  END IF;
  
  -- Count total lines
  SELECT COUNT(*) INTO total_lines
  FROM warehouse_receipt_lines
  WHERE receipt_id = receipt_id_param;
  
  IF total_lines = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Receipt has no items to post'
    );
  END IF;
  
  -- Process each receipt line and create inventory transactions
  FOR line_record IN 
    SELECT wrl.*, ii.name as item_name, ii.sku, ii.barcode
    FROM warehouse_receipt_lines wrl
    LEFT JOIN inventory_items ii ON wrl.item_id = ii.id
    WHERE wrl.receipt_id = receipt_id_param
  LOOP
    -- Use quantity_received if available, otherwise fall back to qty
    DECLARE
      final_quantity DECIMAL(10,2);
    BEGIN
      final_quantity := COALESCE(line_record.quantity_received, line_record.qty, 0);
      
      -- Create inventory transaction for this line
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
        current_org_id,
        line_record.item_id,
        receipt_record.warehouse_id,
        'receipt',
        final_quantity,
        line_record.unit_cost,
        final_quantity * line_record.unit_cost,
        NOW(),
        'warehouse_receipt',
        receipt_id_param,
        'Warehouse receipt: ' || COALESCE(receipt_record.receipt_number, receipt_id_param::text),
        auth.uid()
      );
      
      -- Update inventory item quantities
      UPDATE inventory_items
      SET 
        quantity = quantity + final_quantity,
        updated_at = NOW()
      WHERE id = line_record.item_id;
      
      processed_lines := processed_lines + 1;
    END;
  END LOOP;
  
  -- Update receipt status to posted
  UPDATE warehouse_receipts
  SET 
    status = 'posted',
    posted_at = NOW(),
    posted_by = auth.uid(),
    updated_at = NOW()
  WHERE id = receipt_id_param;
  
  -- Return success result
  result := jsonb_build_object(
    'success', true,
    'receipt_id', receipt_id_param,
    'total_lines', total_lines,
    'processed_lines', processed_lines,
    'posted_at', NOW()
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error details
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Create function to validate receipt before posting
CREATE OR REPLACE FUNCTION public.validate_warehouse_receipt(receipt_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  receipt_record RECORD;
  current_org_id UUID;
  line_count INTEGER := 0;
  invalid_lines INTEGER := 0;
  validation_errors TEXT[] := '{}';
  result JSONB;
BEGIN
  current_org_id := get_current_user_organization_id();
  
  -- Check receipt exists
  SELECT * INTO receipt_record 
  FROM warehouse_receipts 
  WHERE id = receipt_id_param 
    AND organization_id = current_org_id;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'errors', ARRAY['Receipt not found']
    );
  END IF;
  
  -- Check receipt is in draft status
  IF receipt_record.status != 'draft' THEN
    validation_errors := array_append(validation_errors, 'Receipt is not in draft status');
  END IF;
  
  -- Check receipt has lines
  SELECT COUNT(*) INTO line_count
  FROM warehouse_receipt_lines
  WHERE receipt_id = receipt_id_param;
  
  IF line_count = 0 THEN
    validation_errors := array_append(validation_errors, 'Receipt has no items');
  END IF;
  
  -- Check for invalid lines (missing quantities, costs, etc.)
  SELECT COUNT(*) INTO invalid_lines
  FROM warehouse_receipt_lines
  WHERE receipt_id = receipt_id_param
    AND (
      (quantity_received IS NULL OR quantity_received <= 0) AND
      (qty IS NULL OR qty <= 0)
    ) OR unit_cost IS NULL OR unit_cost < 0;
  
  IF invalid_lines > 0 THEN
    validation_errors := array_append(validation_errors, 
      invalid_lines || ' line(s) have invalid quantities or costs');
  END IF;
  
  -- Return validation result
  result := jsonb_build_object(
    'valid', array_length(validation_errors, 1) IS NULL,
    'errors', validation_errors,
    'line_count', line_count,
    'invalid_lines', invalid_lines
  );
  
  RETURN result;
END;
$$;

-- Add trigger to automatically update receipt totals
CREATE OR REPLACE FUNCTION public.update_warehouse_receipt_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  receipt_total DECIMAL(10,2);
BEGIN
  -- Calculate total for the receipt using quantity_received or qty
  SELECT COALESCE(SUM(COALESCE(quantity_received, qty, 0) * unit_cost), 0)
  INTO receipt_total
  FROM warehouse_receipt_lines
  WHERE receipt_id = COALESCE(NEW.receipt_id, OLD.receipt_id);
  
  -- Update the receipt total
  UPDATE warehouse_receipts
  SET total_amount = receipt_total,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.receipt_id, OLD.receipt_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for receipt line changes
DROP TRIGGER IF EXISTS update_receipt_totals_trigger ON warehouse_receipt_lines;
CREATE TRIGGER update_receipt_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON warehouse_receipt_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_warehouse_receipt_totals();

COMMENT ON FUNCTION public.process_warehouse_receipt_posting IS 'Processes warehouse receipt posting with proper error handling and inventory updates';
COMMENT ON FUNCTION public.validate_warehouse_receipt IS 'Validates warehouse receipt before posting';