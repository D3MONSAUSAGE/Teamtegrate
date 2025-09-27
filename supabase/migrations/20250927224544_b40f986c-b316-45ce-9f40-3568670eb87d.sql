-- Fix critical inventory value calculation to use warehouse-specific stock
-- This function currently uses inventory_items.current_stock (global org stock) 
-- instead of warehouse_items.on_hand (warehouse-specific stock)

DROP FUNCTION IF EXISTS get_real_time_inventory_value(uuid);

CREATE OR REPLACE FUNCTION get_real_time_inventory_value(p_team_id uuid DEFAULT NULL)
RETURNS TABLE(
  team_id uuid,
  team_name text,
  total_value numeric,
  total_items bigint,
  low_stock_count bigint,
  overstock_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If team_id is provided, get warehouse-specific inventory value
  -- If not provided, aggregate across all warehouses for the organization
  
  IF p_team_id IS NOT NULL THEN
    -- Get warehouse-specific inventory values using warehouse_items.on_hand
    RETURN QUERY
    SELECT 
      w.team_id,
      COALESCE(t.name, 'Main Warehouse') as team_name,
      SUM(wi.on_hand * COALESCE(wi.wac_unit_cost, ii.unit_cost, ii.purchase_price, 0)) as total_value,
      COUNT(wi.item_id) as total_items,
      COUNT(CASE WHEN wi.on_hand <= COALESCE(wi.reorder_min, ii.minimum_threshold, 0) THEN 1 END) as low_stock_count,
      COUNT(CASE WHEN wi.on_hand >= COALESCE(wi.reorder_max, ii.maximum_threshold, 999999) THEN 1 END) as overstock_count
    FROM warehouses w
    LEFT JOIN warehouse_items wi ON w.id = wi.warehouse_id
    LEFT JOIN inventory_items ii ON wi.item_id = ii.id
    LEFT JOIN teams t ON w.team_id = t.id
    WHERE w.team_id = p_team_id
      AND w.organization_id = get_current_user_organization_id()
      AND (ii.id IS NULL OR ii.is_active = true)
    GROUP BY w.team_id, t.name;
  ELSE
    -- Aggregate across all warehouses for the organization
    RETURN QUERY
    SELECT 
      w.team_id,
      COALESCE(t.name, 'Main Warehouse') as team_name,
      SUM(wi.on_hand * COALESCE(wi.wac_unit_cost, ii.unit_cost, ii.purchase_price, 0)) as total_value,
      COUNT(wi.item_id) as total_items,
      COUNT(CASE WHEN wi.on_hand <= COALESCE(wi.reorder_min, ii.minimum_threshold, 0) THEN 1 END) as low_stock_count,
      COUNT(CASE WHEN wi.on_hand >= COALESCE(wi.reorder_max, ii.maximum_threshold, 999999) THEN 1 END) as overstock_count
    FROM warehouses w
    LEFT JOIN warehouse_items wi ON w.id = wi.warehouse_id
    LEFT JOIN inventory_items ii ON wi.item_id = ii.id
    LEFT JOIN teams t ON w.team_id = t.id
    WHERE w.organization_id = get_current_user_organization_id()
      AND (ii.id IS NULL OR ii.is_active = true)
    GROUP BY w.team_id, t.name
    ORDER BY team_name;
  END IF;
END;
$$;