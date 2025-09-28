-- Drop all existing inventory reporting functions with their exact signatures
DROP FUNCTION IF EXISTS public.get_daily_movements(uuid,date,uuid,uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_daily_movements(date,uuid,uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_warehouse_daily_movements(uuid,uuid,date) CASCADE;
DROP FUNCTION IF EXISTS public.get_warehouse_daily_movements(date,uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_real_time_inventory_value(uuid,uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_real_time_inventory_value(uuid) CASCADE;

-- Create clean inventory reporting functions

-- Function to get daily movements for a specific date and team/warehouse
CREATE FUNCTION public.get_daily_movements(
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.transaction_type::TEXT,
    COUNT(*)::BIGINT as transaction_count,
    COALESCE(SUM(it.quantity), 0)::NUMERIC as total_quantity,
    COALESCE(SUM(it.total_value), 0)::NUMERIC as total_value,
    ARRAY_AGG(DISTINCT it.purchase_order_number) FILTER (WHERE it.purchase_order_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  JOIN inventory_items ii ON it.item_id = ii.id
  WHERE it.transaction_date::DATE = p_date
    AND (p_organization_id IS NULL OR ii.organization_id = p_organization_id)
    AND (p_team_id IS NULL OR ii.team_id = p_team_id)
    AND (p_warehouse_id IS NULL OR it.warehouse_id = p_warehouse_id)
  GROUP BY it.transaction_type
  ORDER BY it.transaction_type;
END;
$$;

-- Function to get warehouse-specific daily movements
CREATE FUNCTION public.get_warehouse_daily_movements(
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.transaction_type::TEXT,
    COUNT(*)::BIGINT as transaction_count,
    COALESCE(SUM(it.quantity), 0)::NUMERIC as total_quantity,
    COALESCE(SUM(it.total_value), 0)::NUMERIC as total_value,
    ARRAY_AGG(DISTINCT it.purchase_order_number) FILTER (WHERE it.purchase_order_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  JOIN inventory_items ii ON it.item_id = ii.id
  WHERE it.transaction_date::DATE = p_date
    AND it.warehouse_id = p_warehouse_id
    AND (p_organization_id IS NULL OR ii.organization_id = p_organization_id)
  GROUP BY it.transaction_type
  ORDER BY it.transaction_type;
END;
$$;

-- Function to get real-time inventory value
CREATE FUNCTION public.get_real_time_inventory_value(
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ii.current_stock * ii.unit_cost), 0)::NUMERIC as total_value,
    COUNT(*)::BIGINT as item_count,
    COUNT(*) FILTER (WHERE ii.current_stock <= ii.reorder_point)::BIGINT as low_stock_items,
    COUNT(*) FILTER (WHERE ii.current_stock >= ii.max_stock_level)::BIGINT as overstock_items
  FROM inventory_items ii
  WHERE (p_organization_id IS NULL OR ii.organization_id = p_organization_id)
    AND (p_team_id IS NULL OR ii.team_id = p_team_id)
    AND ii.is_active = true;
END;
$$;

-- Function to get team inventory summaries
CREATE FUNCTION public.get_team_inventory_summary(
  p_organization_id UUID
)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  total_value NUMERIC,
  item_count BIGINT,
  low_stock_count BIGINT,
  overstock_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as team_id,
    t.name as team_name,
    COALESCE(SUM(ii.current_stock * ii.unit_cost), 0)::NUMERIC as total_value,
    COUNT(ii.id)::BIGINT as item_count,
    COUNT(ii.id) FILTER (WHERE ii.current_stock <= ii.reorder_point)::BIGINT as low_stock_count,
    COUNT(ii.id) FILTER (WHERE ii.current_stock >= ii.max_stock_level)::BIGINT as overstock_count
  FROM teams t
  LEFT JOIN inventory_items ii ON t.id = ii.team_id AND ii.is_active = true
  WHERE t.organization_id = p_organization_id 
    AND t.is_active = true
  GROUP BY t.id, t.name
  ORDER BY t.name;
END;
$$;