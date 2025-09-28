-- Fix the daily movements functions to work with actual table structure
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