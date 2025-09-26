-- Fix security issues for the new functions by adding search_path
CREATE OR REPLACE FUNCTION get_real_time_inventory_value(p_team_id UUID DEFAULT NULL)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  total_value NUMERIC,
  total_items BIGINT,
  low_stock_count BIGINT,
  overstock_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ii.team_id,
    t.name as team_name,
    SUM(ii.current_stock * COALESCE(ii.unit_cost, ii.purchase_price, 0)) as total_value,
    COUNT(ii.id) as total_items,
    COUNT(CASE WHEN ii.current_stock <= COALESCE(ii.minimum_threshold, 0) THEN 1 END) as low_stock_count,
    COUNT(CASE WHEN ii.current_stock >= COALESCE(ii.maximum_threshold, 999999) THEN 1 END) as overstock_count
  FROM inventory_items ii
  LEFT JOIN teams t ON ii.team_id = t.id
  WHERE ii.is_active = true
    AND (p_team_id IS NULL OR ii.team_id = p_team_id)
    AND ii.organization_id = get_current_user_organization_id()
  GROUP BY ii.team_id, t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix daily movements function
CREATE OR REPLACE FUNCTION get_daily_movements(p_date DATE DEFAULT CURRENT_DATE, p_team_id UUID DEFAULT NULL)
RETURNS TABLE (
  transaction_type TEXT,
  transaction_count BIGINT,
  total_quantity NUMERIC,
  total_value NUMERIC,
  po_numbers TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.transaction_type,
    COUNT(*) as transaction_count,
    SUM(it.quantity) as total_quantity,
    SUM(it.quantity * COALESCE(ii.unit_cost, ii.purchase_price, 0)) as total_value,
    ARRAY_AGG(DISTINCT it.reference_number) FILTER (WHERE it.reference_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  JOIN inventory_items ii ON it.item_id = ii.id
  WHERE DATE(it.transaction_date) = p_date
    AND (p_team_id IS NULL OR ii.team_id = p_team_id)
    AND ii.organization_id = get_current_user_organization_id()
  GROUP BY it.transaction_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;