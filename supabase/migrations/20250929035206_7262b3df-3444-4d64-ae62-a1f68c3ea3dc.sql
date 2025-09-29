-- Fix the warehouse_receive_stock function to use correct column names and improve logging
CREATE OR REPLACE FUNCTION public.warehouse_receive_stock(
  p_item_id uuid, 
  p_quantity integer, 
  p_warehouse_id uuid, 
  p_unit_cost numeric, 
  p_lot_number text DEFAULT NULL::text, 
  p_vendor_id uuid DEFAULT NULL::uuid, 
  p_invoice_number text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_warehouse_item_id uuid;
  v_org_id uuid;
  v_item_exists boolean := false;
  v_current_user_id uuid;
  v_result jsonb;
  v_new_stock_level numeric;
BEGIN
  -- Get current user ID and log it
  v_current_user_id := auth.uid();
  RAISE LOG 'warehouse_receive_stock: Starting with user_id=%, item_id=%, quantity=%, warehouse_id=%', 
    v_current_user_id, p_item_id, p_quantity, p_warehouse_id;
  
  -- Get organization ID from current user
  SELECT organization_id INTO v_org_id 
  FROM users 
  WHERE id = v_current_user_id;
  
  RAISE LOG 'warehouse_receive_stock: Found org_id=% for user=%', v_org_id, v_current_user_id;
  
  IF v_org_id IS NULL THEN
    RAISE LOG 'warehouse_receive_stock: User not found or not authenticated, user_id=%', v_current_user_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found or not authenticated',
      'user_id', v_current_user_id
    );
  END IF;
  
  -- Verify the item exists in master inventory for this organization
  IF NOT EXISTS (
    SELECT 1 FROM inventory_items 
    WHERE id = p_item_id AND organization_id = v_org_id
  ) THEN
    RAISE LOG 'warehouse_receive_stock: Item not found in master inventory, item_id=%, org_id=%', p_item_id, v_org_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item not found in master inventory',
      'item_id', p_item_id,
      'org_id', v_org_id
    );
  END IF;
  
  -- Check if item already exists in warehouse (using correct table structure)
  SELECT COALESCE(on_hand, 0) INTO v_new_stock_level
  FROM warehouse_items 
  WHERE item_id = p_item_id 
    AND warehouse_id = p_warehouse_id 
    AND organization_id = v_org_id;
  
  v_item_exists := FOUND;
  RAISE LOG 'warehouse_receive_stock: Item exists in warehouse=%, current_stock=%', v_item_exists, v_new_stock_level;
  
  -- If item doesn't exist in warehouse, create it
  IF NOT v_item_exists THEN
    INSERT INTO warehouse_items (
      item_id,
      warehouse_id,
      organization_id,
      on_hand,
      reorder_min,
      reorder_max
    ) VALUES (
      p_item_id,
      p_warehouse_id,
      v_org_id,
      p_quantity,
      0, -- default minimum stock
      NULL -- no maximum stock limit
    );
    
    v_new_stock_level := p_quantity;
    RAISE LOG 'warehouse_receive_stock: Created new warehouse item with stock=%', v_new_stock_level;
  ELSE
    -- Item exists, update stock quantity
    UPDATE warehouse_items 
    SET 
      on_hand = on_hand + p_quantity,
      updated_at = now()
    WHERE item_id = p_item_id 
      AND warehouse_id = p_warehouse_id 
      AND organization_id = v_org_id;
    
    v_new_stock_level := v_new_stock_level + p_quantity;
    RAISE LOG 'warehouse_receive_stock: Updated warehouse item, new_stock=%', v_new_stock_level;
  END IF;
  
  -- Create inventory transaction record (if table exists)
  BEGIN
    INSERT INTO inventory_transactions (
      item_id,
      warehouse_id,
      organization_id,
      transaction_type,
      quantity,
      unit_cost,
      lot_number,
      vendor_id,
      invoice_number,
      created_by
    ) VALUES (
      p_item_id,
      p_warehouse_id,
      v_org_id,
      'receive',
      p_quantity,
      p_unit_cost,
      p_lot_number,
      p_vendor_id,
      p_invoice_number,
      v_current_user_id
    );
    RAISE LOG 'warehouse_receive_stock: Created transaction record';
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'warehouse_receive_stock: Could not create transaction record: %', SQLERRM;
    -- Continue without failing the entire operation
  END;
  
  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'item_existed', v_item_exists,
    'new_stock_level', v_new_stock_level,
    'quantity_added', p_quantity
  );
  
  RAISE LOG 'warehouse_receive_stock: SUCCESS - %', v_result;
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'warehouse_receive_stock: ERROR - %', SQLERRM;
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'context', 'warehouse_receive_stock function'
  );
END;
$function$;