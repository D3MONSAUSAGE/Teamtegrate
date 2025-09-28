-- Fix column ambiguity errors in inventory reporting functions

-- Drop and recreate get_daily_movements function with proper column qualification
DROP FUNCTION IF EXISTS get_daily_movements(uuid, date);

CREATE OR REPLACE FUNCTION get_daily_movements(
  p_organization_id uuid,
  p_date date
)
RETURNS TABLE (
  transaction_type text,
  total_quantity numeric,
  total_value numeric,
  transaction_count bigint,
  po_numbers text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.transaction_type,
    COALESCE(SUM(it.quantity), 0) as total_quantity,
    COALESCE(SUM(it.unit_price * it.quantity), 0) as total_value,
    COUNT(*)::bigint as transaction_count,
    ARRAY_AGG(DISTINCT it.po_number) FILTER (WHERE it.po_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  WHERE it.organization_id = p_organization_id
    AND DATE(it.transaction_date AT TIME ZONE 'UTC') = p_date
  GROUP BY it.transaction_type
  ORDER BY it.transaction_type;
END;
$$;

-- Drop and recreate get_warehouse_daily_movements function with proper column qualification
DROP FUNCTION IF EXISTS get_warehouse_daily_movements(uuid, date);

CREATE OR REPLACE FUNCTION get_warehouse_daily_movements(
  p_organization_id uuid,
  p_date date
)
RETURNS TABLE (
  transaction_type text,
  total_quantity numeric,
  total_value numeric,
  transaction_count bigint,
  po_numbers text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.transaction_type,
    COALESCE(SUM(it.quantity), 0) as total_quantity,
    COALESCE(SUM(it.unit_price * it.quantity), 0) as total_value,
    COUNT(*)::bigint as transaction_count,
    ARRAY_AGG(DISTINCT it.po_number) FILTER (WHERE it.po_number IS NOT NULL) as po_numbers
  FROM inventory_transactions it
  INNER JOIN inventory_items ii ON it.item_id = ii.id
  WHERE it.organization_id = p_organization_id
    AND ii.organization_id = p_organization_id
    AND DATE(it.transaction_date AT TIME ZONE 'UTC') = p_date
  GROUP BY it.transaction_type
  ORDER BY it.transaction_type;
END;
$$;

-- Drop and recreate get_real_time_inventory_value function with proper column qualification
DROP FUNCTION IF EXISTS get_real_time_inventory_value(uuid);

CREATE OR REPLACE FUNCTION get_real_time_inventory_value(
  p_organization_id uuid
)
RETURNS TABLE (
  total_value numeric,
  item_count bigint,
  low_stock_items bigint,
  categories_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ii.current_stock * COALESCE(ii.unit_price, 0)), 0) as total_value,
    COUNT(*)::bigint as item_count,
    COUNT(*) FILTER (WHERE ii.current_stock <= COALESCE(ii.reorder_point, 10))::bigint as low_stock_items,
    COUNT(DISTINCT ii.category)::bigint as categories_count
  FROM inventory_items ii
  WHERE ii.organization_id = p_organization_id
    AND ii.is_active = true;
END;
$$;