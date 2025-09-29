-- Fix the get_real_time_inventory_value function to properly join tables and get unit_cost
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
  -- Calculate metrics by joining warehouse_items with inventory_items to get unit_cost
  SELECT 
    COALESCE(SUM(wi.on_hand * COALESCE(ii.unit_cost, 0)), 0) as value,
    COUNT(*) as items,
    COUNT(CASE WHEN wi.on_hand <= COALESCE(wi.reorder_min, 0) THEN 1 END) as low_stock,
    COUNT(CASE WHEN wi.on_hand >= COALESCE(wi.reorder_max, 999999) THEN 1 END) as overstock
  INTO total_value, total_items, low_stock_count, overstock_count
  FROM warehouse_items wi
  LEFT JOIN inventory_items ii ON wi.inventory_item_id = ii.id
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