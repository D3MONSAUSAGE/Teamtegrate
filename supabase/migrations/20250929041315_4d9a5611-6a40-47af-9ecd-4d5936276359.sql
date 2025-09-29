-- Fix the get_real_time_inventory_value function with correct column names
CREATE OR REPLACE FUNCTION public.get_real_time_inventory_value(p_warehouse_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_value numeric := 0;
  total_items integer := 0;
  low_stock_count integer := 0;
  overstock_count integer := 0;
BEGIN
  -- Calculate metrics by joining warehouse_items with inventory_items and warehouse_item_settings
  SELECT 
    COALESCE(SUM(wi.on_hand * COALESCE(ii.unit_cost, 0)), 0) as value,
    COUNT(DISTINCT wi.item_id) as items,
    COUNT(DISTINCT CASE WHEN wi.on_hand <= COALESCE(wis.reorder_min, 0) THEN wi.item_id END) as low_stock,
    COUNT(DISTINCT CASE WHEN wi.on_hand >= COALESCE(wis.reorder_max, 999999) THEN wi.item_id END) as overstock
  INTO total_value, total_items, low_stock_count, overstock_count
  FROM warehouse_items wi
  LEFT JOIN inventory_items ii ON wi.item_id = ii.id
  LEFT JOIN warehouse_item_settings wis ON wi.warehouse_id = wis.warehouse_id AND wi.item_id = wis.item_id AND wis.is_active = true
  WHERE wi.warehouse_id = p_warehouse_id
    AND wi.organization_id = get_current_user_organization_id();

  -- Build result object
  result := jsonb_build_object(
    'total_value', total_value,
    'item_count', total_items,
    'low_stock_items', low_stock_count,
    'overstock_items', overstock_count,
    'warehouse_id', p_warehouse_id
  );

  RETURN result;
END;
$$;