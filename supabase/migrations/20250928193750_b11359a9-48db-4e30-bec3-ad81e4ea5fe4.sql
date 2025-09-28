-- Drop the old function that's causing the overload conflict
DROP FUNCTION IF EXISTS public.get_real_time_inventory_value(p_organization_id UUID, p_team_id UUID);

-- Ensure we only have the three-parameter version
CREATE OR REPLACE FUNCTION public.get_real_time_inventory_value(
  p_organization_id UUID,
  p_team_id UUID DEFAULT NULL,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_value NUMERIC,
  item_count BIGINT,
  low_stock_count BIGINT,
  out_of_stock_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(iwi.current_quantity * ii.unit_cost), 0)::NUMERIC as total_value,
    COUNT(DISTINCT ii.id)::BIGINT as item_count,
    COUNT(DISTINCT CASE WHEN iwi.current_quantity <= iwi.reorder_point AND iwi.current_quantity > 0 THEN ii.id END)::BIGINT as low_stock_count,
    COUNT(DISTINCT CASE WHEN iwi.current_quantity <= 0 THEN ii.id END)::BIGINT as out_of_stock_count
  FROM inventory_items ii
  JOIN inventory_warehouse_items iwi ON ii.id = iwi.item_id
  LEFT JOIN warehouses w ON iwi.warehouse_id = w.id
  WHERE (p_organization_id IS NULL OR ii.organization_id = p_organization_id)
    AND (
      -- If filtering by warehouse_id, use that directly
      (p_warehouse_id IS NOT NULL AND iwi.warehouse_id = p_warehouse_id)
      OR
      -- If filtering by team_id, find items in warehouses belonging to that team
      (p_team_id IS NOT NULL AND p_warehouse_id IS NULL AND w.team_id = p_team_id)
      OR
      -- If no team or warehouse filter, show all
      (p_team_id IS NULL AND p_warehouse_id IS NULL)
    );
END;
$$;