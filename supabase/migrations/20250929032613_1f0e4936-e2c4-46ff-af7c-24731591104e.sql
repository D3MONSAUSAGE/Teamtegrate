-- Update the receive_stock function to ensure it works with master inventory approach
-- The function should accept any item from inventory_items table and create warehouse_items records

CREATE OR REPLACE FUNCTION public.receive_stock(
  p_warehouse_id uuid, 
  p_item_id uuid, 
  p_quantity integer, 
  p_unit_cost numeric, 
  p_notes text DEFAULT NULL::text, 
  p_lot_number text DEFAULT NULL::text, 
  p_expiration_date date DEFAULT NULL::date, 
  p_manufacturing_date date DEFAULT NULL::date, 
  p_user_id uuid DEFAULT NULL::uuid,
  p_vendor_id uuid DEFAULT NULL::uuid,
  p_invoice_number text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Verify the item exists in master inventory
  IF NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE id = p_item_id AND organization_id = v_org_id) THEN
    RAISE EXCEPTION 'Item not found in master inventory catalog';
  END IF;
  
  -- Update or insert warehouse item stock (add to existing stock)
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
  
  -- Create inventory transaction for tracking
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
    COALESCE(p_invoice_number, 'SR-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0')),
    v_effective_user_id,
    v_effective_user_id
  );
  
  -- Create inventory lot record if lot information provided
  IF p_lot_number IS NOT NULL THEN
    INSERT INTO public.inventory_lots (
      organization_id,
      item_id,
      lot_number,
      quantity_received,
      quantity_remaining,
      unit_cost,
      expiration_date,
      manufacturing_date,
      vendor_id,
      invoice_number,
      warehouse_id,
      created_by
    ) VALUES (
      v_org_id,
      p_item_id,
      p_lot_number,
      p_quantity,
      p_quantity,
      p_unit_cost,
      p_expiration_date,
      p_manufacturing_date,
      p_vendor_id,
      p_invoice_number,
      p_warehouse_id,
      v_effective_user_id
    );
  END IF;
  
END;
$function$;