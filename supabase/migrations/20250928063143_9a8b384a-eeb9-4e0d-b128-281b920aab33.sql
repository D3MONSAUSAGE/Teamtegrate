-- Drop and recreate the post_warehouse_receipt function without WAC references
DROP FUNCTION IF EXISTS public.post_warehouse_receipt(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.post_warehouse_receipt(
  p_warehouse_id uuid,
  p_receipt_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  receipt_record record;
  line_record record;
  current_quantity numeric := 0;
  receipt_id uuid;
  lot_id uuid;
BEGIN
  -- Get user's organization
  IF get_current_user_organization_id() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated or no organization');
  END IF;

  -- Create warehouse receipt
  INSERT INTO warehouse_receipts (
    warehouse_id,
    receipt_number,
    supplier_name,
    receipt_date,
    total_items,
    status,
    notes,
    organization_id,
    created_by
  )
  SELECT 
    p_warehouse_id,
    (p_receipt_data->>'receipt_number')::text,
    (p_receipt_data->>'supplier_name')::text,
    (p_receipt_data->>'receipt_date')::date,
    (p_receipt_data->>'total_items')::integer,
    COALESCE((p_receipt_data->>'status')::text, 'received'),
    (p_receipt_data->>'notes')::text,
    get_current_user_organization_id(),
    auth.uid()
  RETURNING id INTO receipt_id;

  -- Process each receipt line
  FOR line_record IN 
    SELECT * FROM jsonb_to_recordset(p_receipt_data->'lines') 
    AS x(item_id uuid, quantity_received numeric, unit_cost numeric, lot_number text, expiry_date date)
  LOOP
    -- Insert receipt line
    INSERT INTO warehouse_receipt_lines (
      receipt_id,
      item_id,
      quantity_received,
      unit_cost,
      organization_id
    ) VALUES (
      receipt_id,
      line_record.item_id,
      line_record.quantity_received,
      line_record.unit_cost,
      get_current_user_organization_id()
    );

    -- Create inventory lot if lot details provided
    IF line_record.lot_number IS NOT NULL THEN
      INSERT INTO inventory_lots (
        item_id,
        lot_number,
        quantity_received,
        quantity_remaining,
        expiry_date,
        organization_id,
        created_by
      ) VALUES (
        line_record.item_id,
        line_record.lot_number,
        line_record.quantity_received,
        line_record.quantity_received,
        line_record.expiry_date,
        get_current_user_organization_id(),
        auth.uid()
      ) RETURNING id INTO lot_id;
    END IF;

    -- Update or insert warehouse item
    SELECT on_hand INTO current_quantity
    FROM inventory_warehouse_items
    WHERE warehouse_id = p_warehouse_id 
    AND item_id = line_record.item_id;

    IF FOUND THEN
      -- Update existing warehouse item
      UPDATE inventory_warehouse_items
      SET 
        on_hand = on_hand + line_record.quantity_received,
        sale_price = COALESCE(line_record.unit_cost, sale_price),
        updated_at = NOW()
      WHERE warehouse_id = p_warehouse_id 
      AND item_id = line_record.item_id;
    ELSE
      -- Insert new warehouse item
      INSERT INTO inventory_warehouse_items (
        warehouse_id,
        item_id,
        on_hand,
        sale_price,
        organization_id
      ) VALUES (
        p_warehouse_id,
        line_record.item_id,
        line_record.quantity_received,
        line_record.unit_cost,
        get_current_user_organization_id()
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 
    'receipt_id', receipt_id,
    'message', 'Warehouse receipt posted successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;