-- Fix database functions to use correct table names and columns

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_real_time_inventory_value(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_team_inventory_summary(uuid, uuid);

-- Recreate get_real_time_inventory_value with correct table references
CREATE OR REPLACE FUNCTION public.get_real_time_inventory_value(
  p_organization_id uuid,
  p_team_id uuid DEFAULT NULL,
  p_warehouse_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total_value numeric,
  low_stock_items bigint,
  overstock_items bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(wi.on_hand * ii.unit_cost), 0) as total_value,
    COUNT(CASE WHEN wi.on_hand <= wi.reorder_min THEN 1 END) as low_stock_items,
    COUNT(CASE WHEN wi.on_hand >= wi.max_stock_level THEN 1 END) as overstock_items
  FROM warehouse_items wi
  JOIN inventory_items ii ON wi.item_id = ii.id
  JOIN warehouses w ON wi.warehouse_id = w.id
  WHERE w.organization_id = p_organization_id
    AND (p_team_id IS NULL OR w.team_id = p_team_id)
    AND (p_warehouse_id IS NULL OR wi.warehouse_id = p_warehouse_id);
END;
$$;

-- Recreate get_team_inventory_summary with correct table references
CREATE OR REPLACE FUNCTION public.get_team_inventory_summary(
  p_organization_id uuid,
  p_team_id uuid DEFAULT NULL
)
RETURNS TABLE (
  team_name text,
  total_items bigint,
  low_stock_count bigint,
  out_of_stock_count bigint,
  total_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.name as team_name,
    COUNT(wi.id) as total_items,
    COUNT(CASE WHEN wi.on_hand <= wi.reorder_min THEN 1 END) as low_stock_count,
    COUNT(CASE WHEN wi.on_hand = 0 THEN 1 END) as out_of_stock_count,
    COALESCE(SUM(wi.on_hand * ii.unit_cost), 0) as total_value
  FROM teams t
  LEFT JOIN warehouses w ON t.id = w.team_id
  LEFT JOIN warehouse_items wi ON w.id = wi.warehouse_id
  LEFT JOIN inventory_items ii ON wi.item_id = ii.id
  WHERE t.organization_id = p_organization_id
    AND t.is_active = true
    AND (p_team_id IS NULL OR t.id = p_team_id)
  GROUP BY t.id, t.name
  ORDER BY t.name;
END;
$$;