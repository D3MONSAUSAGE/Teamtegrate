-- Fix the get_real_time_inventory_value function to work with actual table structure
CREATE OR REPLACE FUNCTION public.get_real_time_inventory_value(
  p_organization_id UUID,
  p_team_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_value NUMERIC,
  item_count BIGINT,
  low_stock_items BIGINT,
  overstock_items BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ii.current_stock * ii.unit_cost), 0)::NUMERIC as total_value,
    COUNT(*)::BIGINT as item_count,
    COUNT(*) FILTER (WHERE ii.current_stock <= COALESCE(ii.reorder_point, 10))::BIGINT as low_stock_items,
    COUNT(*) FILTER (WHERE ii.current_stock >= 100)::BIGINT as overstock_items
  FROM inventory_items ii
  WHERE (p_organization_id IS NULL OR ii.organization_id = p_organization_id)
    AND (p_team_id IS NULL OR ii.team_id = p_team_id)
    AND ii.is_active = true;
END;
$$;