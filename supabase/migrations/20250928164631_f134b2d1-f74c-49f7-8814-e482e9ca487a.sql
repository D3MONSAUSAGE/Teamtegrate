-- Create warehouse reporting infrastructure with correct schemas

-- 1. Create new get_real_time_inventory_value function using correct warehouse columns
DROP FUNCTION IF EXISTS public.get_real_time_inventory_value(uuid);

CREATE OR REPLACE FUNCTION public.get_real_time_inventory_value(team_id_param uuid DEFAULT NULL)
RETURNS TABLE (
  team_id uuid,
  team_name text,
  item_id uuid,
  item_name text,
  current_stock numeric,
  unit_cost numeric,
  total_value numeric,
  reorder_point numeric,
  max_stock_level numeric
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as team_id,
    t.name as team_name,
    wi.item_id,
    ii.name as item_name,
    wi.on_hand as current_stock,
    COALESCE(wrl.unit_cost, 0) as unit_cost,
    (wi.on_hand * COALESCE(wrl.unit_cost, 0)) as total_value,
    COALESCE(wi.reorder_min, 0) as reorder_point,
    COALESCE(wi.reorder_max, 0) as max_stock_level
  FROM warehouse_items wi
  JOIN inventory_items ii ON wi.item_id = ii.id
  JOIN warehouses w ON wi.warehouse_id = w.id
  JOIN teams t ON w.team_id = t.id
  LEFT JOIN (
    SELECT DISTINCT ON (item_id) item_id, unit_cost
    FROM warehouse_receipt_lines wrl2
    JOIN warehouse_receipts wr ON wrl2.receipt_id = wr.id
    WHERE wr.status = 'posted'
    ORDER BY item_id, wrl2.posted_at DESC
  ) wrl ON wi.item_id = wrl.item_id
  WHERE (team_id_param IS NULL OR t.id = team_id_param)
    AND wi.on_hand > 0;
END;
$$;

-- 2. Create get_daily_movements function to work with warehouse receipts
CREATE OR REPLACE FUNCTION public.get_daily_movements(p_date date DEFAULT CURRENT_DATE, p_team_id uuid DEFAULT NULL)
RETURNS TABLE (
  transaction_type text,
  transaction_count bigint,
  total_quantity numeric,
  total_value numeric,
  po_numbers text[]
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- First try existing inventory_transactions
  RETURN QUERY
  SELECT 
    it.transaction_type,
    COUNT(*) as transaction_count,
    SUM(ABS(it.quantity)) as total_quantity,
    SUM(ABS(it.quantity) * COALESCE(it.unit_cost, 0)) as total_value,
    ARRAY_AGG(DISTINCT it.reference_number) FILTER (WHERE it.reference_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  WHERE DATE(it.transaction_date) = p_date
    AND (p_team_id IS NULL OR it.team_id = p_team_id)
    AND it.organization_id = get_current_user_organization_id()
  GROUP BY it.transaction_type
  
  UNION ALL
  
  -- Add warehouse receipts as "in" transactions
  SELECT 
    'in' as transaction_type,
    COUNT(*) as transaction_count,
    SUM(wrl.qty) as total_quantity,
    SUM(wrl.qty * wrl.unit_cost) as total_value,
    ARRAY_AGG(DISTINCT wr.vendor_invoice) FILTER (WHERE wr.vendor_invoice IS NOT NULL) as po_numbers
  FROM warehouse_receipt_lines wrl
  JOIN warehouse_receipts wr ON wrl.receipt_id = wr.id
  JOIN warehouses w ON wr.warehouse_id = w.id
  JOIN teams t ON w.team_id = t.id
  WHERE DATE(wr.received_at) = p_date
    AND wr.status = 'posted'
    AND (p_team_id IS NULL OR t.id = p_team_id)
  HAVING COUNT(*) > 0;
END;
$$;

-- 3. Create weekly_inventory_movements view
DROP VIEW IF EXISTS public.weekly_inventory_movements;
CREATE VIEW public.weekly_inventory_movements AS
SELECT 
  DATE_TRUNC('week', wr.received_at)::date as week_start,
  t.id as team_id,
  t.name as team_name,
  'in' as transaction_type,
  COUNT(*) as transaction_count,
  SUM(wrl.qty) as total_quantity,
  SUM(wrl.qty * wrl.unit_cost) as total_value,
  STRING_AGG(DISTINCT wr.vendor_invoice, ', ') as po_number,
  STRING_AGG(DISTINCT wr.vendor_name, ', ') as vendor_name
FROM warehouse_receipt_lines wrl
JOIN warehouse_receipts wr ON wrl.receipt_id = wr.id
JOIN warehouses w ON wr.warehouse_id = w.id
JOIN teams t ON w.team_id = t.id
WHERE wr.received_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '12 weeks'
  AND wr.status = 'posted'
GROUP BY 
  DATE_TRUNC('week', wr.received_at),
  t.id,
  t.name
ORDER BY week_start DESC, team_name;

-- 4. Create daily_inventory_summary view using correct warehouse columns
DROP VIEW IF EXISTS public.daily_inventory_summary;
CREATE VIEW public.daily_inventory_summary AS
SELECT 
  CURRENT_DATE as summary_date,
  t.id as team_id,
  t.name as team_name,
  COUNT(DISTINCT wi.item_id) as total_items,
  SUM(wi.on_hand * COALESCE(recent_costs.unit_cost, 0)) as total_inventory_value,
  SUM(wi.on_hand) as total_stock_quantity,
  COUNT(*) FILTER (WHERE wi.on_hand <= COALESCE(wi.reorder_min, 0)) as low_stock_items,
  COUNT(*) FILTER (WHERE wi.on_hand >= COALESCE(wi.reorder_max, 999999)) as overstock_items
FROM warehouse_items wi
JOIN warehouses w ON wi.warehouse_id = w.id
JOIN teams t ON w.team_id = t.id
LEFT JOIN (
  SELECT DISTINCT ON (item_id) item_id, unit_cost
  FROM warehouse_receipt_lines wrl2
  JOIN warehouse_receipts wr ON wrl2.receipt_id = wr.id
  WHERE wr.status = 'posted'
  ORDER BY item_id, wrl2.posted_at DESC
) recent_costs ON wi.item_id = recent_costs.item_id
WHERE wi.on_hand > 0
GROUP BY t.id, t.name;

-- 5. Create monthly_team_performance view using correct column names
DROP VIEW IF EXISTS public.monthly_team_performance;
CREATE VIEW public.monthly_team_performance AS
SELECT 
  DATE_TRUNC('month', ic.created_at)::date as month_start,
  ic.team_id as team_id,
  t.name as team_name,
  COUNT(*) as total_counts,
  AVG(CASE WHEN ic.status = 'completed' THEN 100.0 ELSE 0.0 END) as avg_completion_rate,
  COALESCE(SUM(CASE WHEN ic.status = 'completed' THEN ic.total_items_count ELSE 0 END), 0) as items_counted,
  COALESCE(SUM(CASE WHEN ic.status = 'completed' THEN ic.variance_count ELSE 0 END), 0) as total_variances,
  COUNT(*) FILTER (WHERE ic.status = 'completed') as completed_counts,
  CASE 
    WHEN COUNT(*) FILTER (WHERE ic.status = 'completed') > 0 THEN
      (COUNT(*) FILTER (WHERE ic.status = 'completed' AND COALESCE(ic.variance_count, 0) = 0) * 100.0 / COUNT(*) FILTER (WHERE ic.status = 'completed'))
    ELSE 0
  END as calculated_accuracy_percentage
FROM inventory_counts ic
LEFT JOIN teams t ON ic.team_id = t.id
WHERE ic.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', ic.created_at), ic.team_id, t.name
ORDER BY month_start DESC, team_name;

-- 6. Create vendor_performance_analytics view
DROP VIEW IF EXISTS public.vendor_performance_analytics;
CREATE VIEW public.vendor_performance_analytics AS
SELECT 
  v.id as vendor_id,
  v.name as vendor_name,
  COUNT(DISTINCT ii.id) as items_supplied,
  AVG(recent_costs.unit_cost) as avg_item_cost,
  COALESCE(SUM(wi.on_hand * COALESCE(recent_costs.unit_cost, 0)), 0) as total_inventory_value,
  COUNT(DISTINCT wr.id) as total_transactions,
  MAX(wr.received_at)::date as last_transaction_date,
  COUNT(DISTINCT t.id) as teams_served
FROM vendors v
JOIN inventory_items ii ON ii.vendor_id = v.id
LEFT JOIN warehouse_items wi ON wi.item_id = ii.id
LEFT JOIN warehouses w ON wi.warehouse_id = w.id
LEFT JOIN teams t ON w.team_id = t.id
LEFT JOIN warehouse_receipts wr ON wr.vendor_name = v.name AND wr.status = 'posted'
LEFT JOIN (
  SELECT DISTINCT ON (item_id) item_id, unit_cost
  FROM warehouse_receipt_lines wrl2
  JOIN warehouse_receipts wr2 ON wrl2.receipt_id = wr2.id
  WHERE wr2.status = 'posted'
  ORDER BY item_id, wrl2.posted_at DESC
) recent_costs ON ii.id = recent_costs.item_id
GROUP BY v.id, v.name
HAVING COUNT(DISTINCT ii.id) > 0
ORDER BY total_inventory_value DESC;