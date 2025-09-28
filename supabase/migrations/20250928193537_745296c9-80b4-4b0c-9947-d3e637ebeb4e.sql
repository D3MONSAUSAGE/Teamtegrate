-- Fix inventory reporting functions for master catalog item model
-- Key changes:
-- 1. Use 'po_number' instead of 'purchase_order_number' 
-- 2. For warehouse reports: filter by warehouse_id only, ignore item team_id
-- 3. For team reports: join through warehouses to get team association

CREATE OR REPLACE FUNCTION public.get_daily_movements(
  p_organization_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_team_id UUID DEFAULT NULL,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE (
  transaction_type TEXT,
  transaction_count BIGINT,
  total_quantity NUMERIC,
  total_value NUMERIC,
  po_numbers TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.transaction_type::TEXT,
    COUNT(*)::BIGINT as transaction_count,
    COALESCE(SUM(it.quantity), 0)::NUMERIC as total_quantity,
    COALESCE(SUM(it.quantity * ii.unit_cost), 0)::NUMERIC as total_value,
    ARRAY_AGG(DISTINCT it.po_number) FILTER (WHERE it.po_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  JOIN inventory_items ii ON it.item_id = ii.id
  LEFT JOIN warehouses w ON it.warehouse_id = w.id
  WHERE it.transaction_date::DATE = p_date
    AND (p_organization_id IS NULL OR ii.organization_id = p_organization_id)
    AND (
      -- If filtering by warehouse_id, use that directly
      (p_warehouse_id IS NOT NULL AND it.warehouse_id = p_warehouse_id)
      OR
      -- If filtering by team_id, find transactions in warehouses belonging to that team
      (p_team_id IS NOT NULL AND p_warehouse_id IS NULL AND w.team_id = p_team_id)
      OR
      -- If no team or warehouse filter, show all
      (p_team_id IS NULL AND p_warehouse_id IS NULL)
    )
  GROUP BY it.transaction_type
  ORDER BY it.transaction_type;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_warehouse_daily_movements(
  p_organization_id UUID,
  p_warehouse_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  transaction_type TEXT,
  transaction_count BIGINT,
  total_quantity NUMERIC,
  total_value NUMERIC,
  po_numbers TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.transaction_type::TEXT,
    COUNT(*)::BIGINT as transaction_count,
    COALESCE(SUM(it.quantity), 0)::NUMERIC as total_quantity,
    COALESCE(SUM(it.quantity * ii.unit_cost), 0)::NUMERIC as total_value,
    ARRAY_AGG(DISTINCT it.po_number) FILTER (WHERE it.po_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  JOIN inventory_items ii ON it.item_id = ii.id
  WHERE it.transaction_date::DATE = p_date
    AND it.warehouse_id = p_warehouse_id
    AND (p_organization_id IS NULL OR ii.organization_id = p_organization_id)
  GROUP BY it.transaction_type
  ORDER BY it.transaction_type;
END;
$$;

-- Fix other inventory reporting functions to handle master catalog items
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

CREATE OR REPLACE FUNCTION public.get_team_inventory_summary(
  p_organization_id UUID,
  p_team_id UUID DEFAULT NULL
)
RETURNS TABLE (
  team_name TEXT,
  total_value NUMERIC,
  item_count BIGINT,
  warehouse_count BIGINT,
  recent_transactions BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.name::TEXT as team_name,
    COALESCE(SUM(iwi.current_quantity * ii.unit_cost), 0)::NUMERIC as total_value,
    COUNT(DISTINCT ii.id)::BIGINT as item_count,
    COUNT(DISTINCT w.id)::BIGINT as warehouse_count,
    (
      SELECT COUNT(*)::BIGINT 
      FROM inventory_transactions it2
      JOIN warehouses w2 ON it2.warehouse_id = w2.id
      WHERE w2.team_id = t.id
      AND it2.transaction_date >= CURRENT_DATE - INTERVAL '7 days'
    ) as recent_transactions
  FROM teams t
  LEFT JOIN warehouses w ON t.id = w.team_id
  LEFT JOIN inventory_warehouse_items iwi ON w.id = iwi.warehouse_id
  LEFT JOIN inventory_items ii ON iwi.item_id = ii.id
  WHERE t.organization_id = p_organization_id
    AND t.is_active = true
    AND (p_team_id IS NULL OR t.id = p_team_id)
  GROUP BY t.id, t.name
  ORDER BY total_value DESC;
END;
$$;