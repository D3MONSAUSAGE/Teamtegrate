-- Drop all existing receive_stock function overloads to eliminate conflicts
DROP FUNCTION IF EXISTS public.receive_stock(uuid, uuid, integer, text, text, uuid, text, text);
DROP FUNCTION IF EXISTS public.receive_stock(uuid, uuid, integer, text, text, uuid, text);
DROP FUNCTION IF EXISTS public.receive_stock(uuid, uuid, integer, text, text, uuid);
DROP FUNCTION IF EXISTS public.receive_stock(uuid, uuid, integer, text, text);
DROP FUNCTION IF EXISTS public.receive_stock(uuid, uuid, integer, text);
DROP FUNCTION IF EXISTS public.receive_stock(uuid, uuid, integer);

-- Create unified receive_stock function with master inventory approach
CREATE OR REPLACE FUNCTION public.receive_stock(
  p_item_id uuid,
  p_warehouse_id uuid,
  p_quantity integer,
  p_lot_number text DEFAULT NULL,
  p_vendor text DEFAULT NULL,
  p_vendor_id uuid DEFAULT NULL,
  p_invoice_number text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_warehouse_item_id uuid;
  v_org_id uuid;
  v_item_exists boolean := false;
  v_result jsonb;
BEGIN
  -- Get organization ID from current user
  SELECT organization_id INTO v_org_id FROM users WHERE id = auth.uid();
  
  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found or not authenticated'
    );
  END IF;
  
  -- Verify the item exists in master inventory for this organization
  IF NOT EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE id = p_item_id AND organization_id = v_org_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item not found in master inventory'
    );
  END IF;
  
  -- Check if item already exists in warehouse
  SELECT id INTO v_warehouse_item_id
  FROM warehouse_items 
  WHERE item_id = p_item_id 
    AND warehouse_id = p_warehouse_id 
    AND organization_id = v_org_id;
  
  v_item_exists := v_warehouse_item_id IS NOT NULL;
  
  -- If item doesn't exist in warehouse, create it
  IF NOT v_item_exists THEN
    INSERT INTO warehouse_items (
      item_id,
      warehouse_id,
      organization_id,
      current_stock,
      minimum_stock,
      maximum_stock,
      lot_number,
      vendor,
      vendor_id,
      created_by
    ) VALUES (
      p_item_id,
      p_warehouse_id,
      v_org_id,
      p_quantity,
      0, -- default minimum stock
      NULL, -- no maximum stock limit
      p_lot_number,
      p_vendor,
      p_vendor_id,
      auth.uid()
    )
    RETURNING id INTO v_warehouse_item_id;
  ELSE
    -- Item exists, update stock quantity
    UPDATE warehouse_items 
    SET 
      current_stock = current_stock + p_quantity,
      lot_number = COALESCE(p_lot_number, lot_number),
      vendor = COALESCE(p_vendor, vendor),
      vendor_id = COALESCE(p_vendor_id, vendor_id),
      updated_at = now()
    WHERE id = v_warehouse_item_id;
  END IF;
  
  -- Create inventory transaction record
  INSERT INTO inventory_transactions (
    item_id,
    warehouse_id,
    organization_id,
    transaction_type,
    quantity,
    lot_number,
    vendor,
    vendor_id,
    invoice_number,
    notes,
    created_by
  ) VALUES (
    p_item_id,
    p_warehouse_id,
    v_org_id,
    'receive',
    p_quantity,
    p_lot_number,
    p_vendor,
    p_vendor_id,
    p_invoice_number,
    p_notes,
    auth.uid()
  );
  
  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'warehouse_item_id', v_warehouse_item_id,
    'item_existed', v_item_exists,
    'new_stock_level', (
      SELECT current_stock 
      FROM warehouse_items 
      WHERE id = v_warehouse_item_id
    )
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;