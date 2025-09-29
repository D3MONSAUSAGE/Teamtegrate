-- Fix receive_stock function and warehouse_items schema inconsistencies

-- First, drop the problematic receive_stock function that expects non-existent columns
DROP FUNCTION IF EXISTS public.receive_stock(UUID, NUMERIC, NUMERIC, TEXT, UUID, TEXT);

-- Add missing timestamp columns to warehouse_items table
ALTER TABLE public.warehouse_items 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create the correct receive_stock function that works with existing schema
CREATE OR REPLACE FUNCTION public.receive_stock(
  p_item_id UUID,
  p_quantity NUMERIC,
  p_unit_cost NUMERIC DEFAULT NULL,
  p_lot_number TEXT DEFAULT NULL,
  p_vendor_id UUID DEFAULT NULL,
  p_invoice_number TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_warehouse_id UUID;
  v_transaction_id UUID;
  v_lot_id UUID;
  v_generated_lot TEXT;
  v_result jsonb;
BEGIN
  -- Get user's organization
  v_org_id := get_current_user_organization_id();
  
  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization not found');
  END IF;

  -- Get default warehouse for organization
  SELECT id INTO v_warehouse_id 
  FROM warehouses 
  WHERE organization_id = v_org_id 
  ORDER BY created_at 
  LIMIT 1;
  
  IF v_warehouse_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No warehouse found');
  END IF;

  -- Generate lot number if not provided
  IF p_lot_number IS NULL OR p_lot_number = '' THEN
    v_generated_lot := 'LOT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || 
                       LPAD((EXTRACT(EPOCH FROM now())::BIGINT % 10000)::TEXT, 4, '0');
  ELSE
    v_generated_lot := p_lot_number;
  END IF;

  -- Create inventory lot record
  INSERT INTO inventory_lots (
    item_id, lot_number, quantity_remaining, unit_cost, 
    vendor_id, invoice_number, organization_id, created_by
  ) VALUES (
    p_item_id, v_generated_lot, p_quantity, COALESCE(p_unit_cost, 0),
    p_vendor_id, p_invoice_number, v_org_id, auth.uid()
  ) RETURNING id INTO v_lot_id;

  -- Update warehouse_items quantity
  INSERT INTO warehouse_items (item_id, warehouse_id, on_hand, organization_id)
  VALUES (p_item_id, v_warehouse_id, p_quantity, v_org_id)
  ON CONFLICT (item_id, warehouse_id) 
  DO UPDATE SET 
    on_hand = warehouse_items.on_hand + p_quantity,
    updated_at = now();

  -- Create inventory transaction record
  INSERT INTO inventory_transactions (
    item_id, transaction_type, quantity, unit_cost, lot_number,
    vendor_id, invoice_number, organization_id, processed_by, warehouse_id
  ) VALUES (
    p_item_id, 'receive', p_quantity, COALESCE(p_unit_cost, 0), v_generated_lot,
    p_vendor_id, p_invoice_number, v_org_id, auth.uid(), v_warehouse_id
  ) RETURNING id INTO v_transaction_id;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'lot_id', v_lot_id,
    'lot_number', v_generated_lot,
    'quantity_received', p_quantity
  );

  RETURN v_result;
END;
$$;

-- Create trigger to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_warehouse_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_warehouse_items_updated_at ON public.warehouse_items;
CREATE TRIGGER trigger_warehouse_items_updated_at
  BEFORE UPDATE ON public.warehouse_items
  FOR EACH ROW
  EXECUTE FUNCTION update_warehouse_items_updated_at();