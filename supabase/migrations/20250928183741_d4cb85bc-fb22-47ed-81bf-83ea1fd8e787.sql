-- Fix ambiguous column reference issues in functions

-- Fix get_daily_movements function with proper column aliasing
CREATE OR REPLACE FUNCTION get_daily_movements(
  p_date date DEFAULT CURRENT_DATE,
  p_team_id uuid DEFAULT NULL,
  p_warehouse_id uuid DEFAULT NULL
)
RETURNS TABLE (
  transaction_type text,
  transaction_count bigint,
  total_quantity numeric,
  total_value numeric,
  po_numbers text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_org_id uuid;
BEGIN
  -- Get organization from current user context with proper aliasing
  SELECT u.organization_id INTO current_org_id FROM users u WHERE u.id = auth.uid();
  
  -- If no org found, return empty result
  IF current_org_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    it.transaction_type,
    COUNT(*)::bigint as transaction_count,
    COALESCE(SUM(it.quantity), 0) as total_quantity,
    COALESCE(SUM(COALESCE(it.total_cost, it.unit_cost * it.quantity, 0)), 0) as total_value,
    ARRAY_AGG(DISTINCT it.po_number) FILTER (WHERE it.po_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  INNER JOIN inventory_items ii ON it.item_id = ii.id
  WHERE it.organization_id = current_org_id
    AND ii.organization_id = current_org_id
    AND DATE(it.transaction_date AT TIME ZONE 'UTC') = p_date
    AND (p_team_id IS NULL OR it.team_id = p_team_id)
    AND (p_warehouse_id IS NULL OR ii.warehouse_id = p_warehouse_id)
  GROUP BY it.transaction_type
  ORDER BY it.transaction_type;
END;
$$;

-- Fix get_warehouse_daily_movements function with proper column aliasing
CREATE OR REPLACE FUNCTION get_warehouse_daily_movements(
  p_warehouse_id uuid DEFAULT NULL,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  transaction_type text,
  transaction_count bigint,
  total_quantity numeric,
  total_value numeric,
  po_numbers text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_org_id uuid;
BEGIN
  -- Get organization from current user context with proper aliasing
  SELECT u.organization_id INTO current_org_id FROM users u WHERE u.id = auth.uid();
  
  -- If no org found, return empty result
  IF current_org_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    it.transaction_type,
    COUNT(*)::bigint as transaction_count,
    COALESCE(SUM(it.quantity), 0) as total_quantity,
    COALESCE(SUM(COALESCE(it.total_cost, it.unit_cost * it.quantity, 0)), 0) as total_value,
    ARRAY_AGG(DISTINCT it.po_number) FILTER (WHERE it.po_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  INNER JOIN inventory_items ii ON it.item_id = ii.id
  WHERE it.organization_id = current_org_id
    AND ii.organization_id = current_org_id
    AND DATE(it.transaction_date AT TIME ZONE 'UTC') = p_date
    AND (p_warehouse_id IS NULL OR ii.warehouse_id = p_warehouse_id)
  GROUP BY it.transaction_type
  ORDER BY it.transaction_type;
END;
$$;

-- Fix get_real_time_inventory_value function with proper column aliasing
CREATE OR REPLACE FUNCTION get_real_time_inventory_value(
  p_team_id uuid DEFAULT NULL
)
RETURNS TABLE (
  team_id uuid,
  team_name text,
  total_value numeric,
  item_count bigint,
  low_stock_items bigint,
  overstock_items bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_org_id uuid;
BEGIN
  -- Get organization from current user context with proper aliasing
  SELECT u.organization_id INTO current_org_id FROM users u WHERE u.id = auth.uid();
  
  -- If no org found, return empty result
  IF current_org_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    t.id as team_id,
    t.name as team_name,
    COALESCE(SUM(ii.current_stock * COALESCE(ii.unit_cost, 0)), 0) as total_value,
    COUNT(ii.id)::bigint as item_count,
    COUNT(*) FILTER (WHERE ii.current_stock <= COALESCE(ii.reorder_point, 10))::bigint as low_stock_items,
    COUNT(*) FILTER (WHERE ii.current_stock >= COALESCE(ii.max_stock_level, 1000))::bigint as overstock_items
  FROM teams t
  LEFT JOIN inventory_items ii ON ii.team_id = t.id AND ii.organization_id = current_org_id AND ii.is_active = true
  WHERE t.organization_id = current_org_id
    AND t.is_active = true
    AND (p_team_id IS NULL OR t.id = p_team_id)
  GROUP BY t.id, t.name
  ORDER BY t.name;
END;
$$;