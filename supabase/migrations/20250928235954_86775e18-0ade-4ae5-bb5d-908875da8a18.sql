-- Fix receive_stock function to use correct column names and remove non-existent 'available' column
CREATE OR REPLACE FUNCTION public.receive_stock(
  p_warehouse_id uuid,
  p_item_id uuid,
  p_quantity integer,
  p_unit_cost numeric,
  p_notes text DEFAULT NULL,
  p_lot_number text DEFAULT NULL,
  p_expiration_date date DEFAULT NULL,
  p_manufacturing_date date DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_effective_user_id uuid;
BEGIN
  -- Get user organization
  v_effective_user_id := COALESCE(p_user_id, auth.uid());
  
  SELECT organization_id INTO v_org_id
  FROM public.users
  WHERE id = v_effective_user_id;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Could not determine organization for user';
  END IF;
  
  -- Update or insert warehouse item stock (add to existing stock)
  -- Only use columns that actually exist in warehouse_items table
  INSERT INTO public.warehouse_items (
    warehouse_id, item_id, on_hand, organization_id
  )
  VALUES (
    p_warehouse_id, p_item_id, p_quantity, v_org_id
  )
  ON CONFLICT (warehouse_id, item_id) 
  DO UPDATE SET
    on_hand = warehouse_items.on_hand + p_quantity,
    updated_at = now();
  
  -- Create inventory transaction
  INSERT INTO public.inventory_transactions (
    organization_id,
    item_id,
    warehouse_id,
    transaction_type,
    quantity,
    unit_cost,
    total_cost,
    transaction_date,
    notes,
    reference_number,
    user_id,
    created_by
  ) VALUES (
    v_org_id,
    p_item_id,
    p_warehouse_id,
    'in',
    p_quantity,
    p_unit_cost,
    p_quantity * p_unit_cost,
    CURRENT_DATE,
    COALESCE(p_notes, 'Stock received'),
    'RCV-' || EXTRACT(EPOCH FROM now())::bigint,
    v_effective_user_id,
    v_effective_user_id
  );
  
  -- Create inventory lot if lot number provided
  IF p_lot_number IS NOT NULL THEN
    INSERT INTO public.inventory_lots (
      organization_id,
      item_id,
      lot_number,
      manufacturing_date,
      expiration_date,
      quantity_received,
      quantity_remaining,
      cost_per_unit,
      supplier_info,
      notes,
      is_active,
      created_by
    ) VALUES (
      v_org_id,
      p_item_id,
      p_lot_number,
      p_manufacturing_date,
      p_expiration_date,
      p_quantity,
      p_quantity,
      p_unit_cost,
      '{}',
      COALESCE(p_notes, 'Stock received'),
      true,
      v_effective_user_id
    );
  END IF;
END;
$$;