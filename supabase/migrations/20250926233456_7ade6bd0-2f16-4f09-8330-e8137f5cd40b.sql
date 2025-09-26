-- Create comprehensive database views for team-based inventory analytics (corrected version)

-- Daily inventory summary view by team
CREATE OR REPLACE VIEW daily_inventory_summary AS
SELECT 
  DATE(COALESCE(it.created_at, ii.created_at)) as summary_date,
  ii.team_id,
  t.name as team_name,
  COUNT(DISTINCT ii.id) as total_items,
  SUM(ii.current_stock * COALESCE(ii.unit_cost, ii.purchase_price, 0)) as total_inventory_value,
  SUM(ii.current_stock) as total_stock_quantity,
  COUNT(CASE WHEN ii.current_stock <= COALESCE(ii.minimum_threshold, 0) THEN 1 END) as low_stock_items,
  COUNT(CASE WHEN ii.current_stock >= COALESCE(ii.maximum_threshold, 999999) THEN 1 END) as overstock_items
FROM inventory_items ii
LEFT JOIN teams t ON ii.team_id = t.id
LEFT JOIN inventory_transactions it ON ii.id = it.item_id 
WHERE ii.is_active = true
GROUP BY DATE(COALESCE(it.created_at, ii.created_at)), ii.team_id, t.name;

-- Weekly inventory movement view
CREATE OR REPLACE VIEW weekly_inventory_movements AS
SELECT 
  DATE_TRUNC('week', it.transaction_date) as week_start,
  ii.team_id,
  t.name as team_name,
  it.transaction_type,
  COUNT(*) as transaction_count,
  SUM(it.quantity) as total_quantity,
  SUM(it.quantity * COALESCE(ii.unit_cost, ii.purchase_price, 0)) as total_value,
  it.reference_number as po_number,
  v.name as vendor_name
FROM inventory_transactions it
JOIN inventory_items ii ON it.item_id = ii.id
LEFT JOIN teams t ON ii.team_id = t.id
LEFT JOIN vendors v ON ii.vendor_id = v.id
WHERE ii.is_active = true
GROUP BY 
  DATE_TRUNC('week', it.transaction_date),
  ii.team_id,
  t.name,
  it.transaction_type,
  it.reference_number,
  v.name;

-- Monthly team performance view (using completion_percentage)
CREATE OR REPLACE VIEW monthly_team_performance AS
SELECT 
  DATE_TRUNC('month', ic.count_date) as month_start,
  ic.team_id,
  t.name as team_name,
  COUNT(ic.id) as total_counts,
  AVG(ic.completion_percentage) as avg_completion_rate,
  SUM(ic.total_items_count) as items_counted,
  SUM(ic.variance_count) as total_variances,
  COUNT(CASE WHEN ic.status = 'completed' THEN 1 END) as completed_counts,
  -- Calculate accuracy as (items - variances) / items * 100
  CASE 
    WHEN SUM(ic.total_items_count) > 0 
    THEN (SUM(ic.total_items_count - ic.variance_count)::numeric / SUM(ic.total_items_count) * 100)
    ELSE 0 
  END as calculated_accuracy_percentage
FROM inventory_counts ic
JOIN teams t ON ic.team_id = t.id
WHERE ic.is_voided = false
GROUP BY DATE_TRUNC('month', ic.count_date), ic.team_id, t.name;

-- Vendor performance analytics view
CREATE OR REPLACE VIEW vendor_performance_analytics AS
SELECT 
  v.id as vendor_id,
  v.name as vendor_name,
  COUNT(DISTINCT ii.id) as items_supplied,
  AVG(COALESCE(ii.unit_cost, ii.purchase_price)) as avg_item_cost,
  SUM(ii.current_stock * COALESCE(ii.unit_cost, ii.purchase_price, 0)) as total_inventory_value,
  COUNT(DISTINCT it.id) as total_transactions,
  MAX(it.transaction_date) as last_transaction_date,
  COUNT(DISTINCT ii.team_id) as teams_served
FROM vendors v
LEFT JOIN inventory_items ii ON v.id = ii.vendor_id
LEFT JOIN inventory_transactions it ON ii.id = it.item_id
WHERE ii.is_active = true OR ii.is_active IS NULL
GROUP BY v.id, v.name;

-- Real-time inventory valuation function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily movement summary function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;