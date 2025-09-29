-- Fix the warehouse inventory value function to use correct schema
CREATE OR REPLACE FUNCTION public.get_real_time_inventory_value(p_warehouse_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_data jsonb;
  total_value numeric := 0;
  total_items integer := 0;
  low_stock_count integer := 0;
  overstock_count integer := 0;
BEGIN
  -- Calculate metrics from warehouse_items with proper joins
  SELECT 
    COALESCE(SUM(wi.on_hand * COALESCE(wi.unit_cost, 0)), 0) as value,
    COUNT(*) as items,
    COUNT(CASE 
      WHEN wi.on_hand <= COALESCE(wi.reorder_min, COALESCE(iti.minimum_threshold, 0)) 
      THEN 1 
    END) as low_stock,
    COUNT(CASE 
      WHEN wi.on_hand >= COALESCE(wi.reorder_max, COALESCE(iti.maximum_threshold, 999999)) 
      THEN 1 
    END) as overstock
  INTO total_value, total_items, low_stock_count, overstock_count
  FROM warehouse_items wi
  LEFT JOIN inventory_template_items iti ON wi.item_id = iti.id
  WHERE wi.warehouse_id = p_warehouse_id;

  -- Build the result JSON
  result_data := jsonb_build_object(
    'success', true,
    'total_value', COALESCE(total_value, 0),
    'total_items', COALESCE(total_items, 0),
    'low_stock_items', COALESCE(low_stock_count, 0),
    'overstock_items', COALESCE(overstock_count, 0),
    'warehouse_id', p_warehouse_id
  );

  RETURN result_data;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'total_value', 0,
    'total_items', 0,
    'low_stock_items', 0,
    'overstock_items', 0
  );
END;
$$;