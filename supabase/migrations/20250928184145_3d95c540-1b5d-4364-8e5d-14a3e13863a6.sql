-- Drop ALL possible function signatures explicitly
DROP FUNCTION IF EXISTS get_daily_movements();
DROP FUNCTION IF EXISTS get_daily_movements(date);
DROP FUNCTION IF EXISTS get_daily_movements(date, uuid);
DROP FUNCTION IF EXISTS get_daily_movements(date, uuid, uuid);
DROP FUNCTION IF EXISTS get_daily_movements(date, text, text);
DROP FUNCTION IF EXISTS get_warehouse_daily_movements();
DROP FUNCTION IF EXISTS get_warehouse_daily_movements(uuid);
DROP FUNCTION IF EXISTS get_warehouse_daily_movements(uuid, date);
DROP FUNCTION IF EXISTS get_warehouse_daily_movements(uuid, date, uuid);
DROP FUNCTION IF EXISTS get_warehouse_daily_movements(text, date);
DROP FUNCTION IF EXISTS get_real_time_inventory_value();
DROP FUNCTION IF EXISTS get_real_time_inventory_value(uuid);
DROP FUNCTION IF EXISTS get_real_time_inventory_value(text);
DROP FUNCTION IF EXISTS get_real_time_inventory_value(uuid, uuid);

-- Create clean functions with uuid parameters
CREATE FUNCTION get_daily_movements(
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
  org_id_var uuid;
BEGIN
  SELECT u.organization_id INTO org_id_var FROM public.users u WHERE u.id = auth.uid();
  
  IF org_id_var IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    it.transaction_type,
    COUNT(*)::bigint,
    COALESCE(SUM(it.quantity), 0),
    COALESCE(SUM(COALESCE(it.total_cost, it.unit_cost * it.quantity, 0)), 0),
    ARRAY_AGG(DISTINCT it.po_number) FILTER (WHERE it.po_number IS NOT NULL)
  FROM public.inventory_transactions it
  INNER JOIN public.inventory_items ii ON it.item_id = ii.id
  WHERE it.organization_id = org_id_var
    AND ii.organization_id = org_id_var
    AND DATE(it.transaction_date AT TIME ZONE 'UTC') = p_date
    AND (p_team_id IS NULL OR it.team_id = p_team_id)
    AND (p_warehouse_id IS NULL OR ii.warehouse_id = p_warehouse_id)
  GROUP BY it.transaction_type
  ORDER BY it.transaction_type;
END;
$$;

CREATE FUNCTION get_warehouse_daily_movements(
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
  org_id_var uuid;
BEGIN
  SELECT u.organization_id INTO org_id_var FROM public.users u WHERE u.id = auth.uid();
  
  IF org_id_var IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    it.transaction_type,
    COUNT(*)::bigint,
    COALESCE(SUM(it.quantity), 0),
    COALESCE(SUM(COALESCE(it.total_cost, it.unit_cost * it.quantity, 0)), 0),
    ARRAY_AGG(DISTINCT it.po_number) FILTER (WHERE it.po_number IS NOT NULL)
  FROM public.inventory_transactions it
  INNER JOIN public.inventory_items ii ON it.item_id = ii.id
  WHERE it.organization_id = org_id_var
    AND ii.organization_id = org_id_var
    AND DATE(it.transaction_date AT TIME ZONE 'UTC') = p_date
    AND (p_warehouse_id IS NULL OR ii.warehouse_id = p_warehouse_id)
  GROUP BY it.transaction_type
  ORDER BY it.transaction_type;
END;
$$;

CREATE FUNCTION get_real_time_inventory_value(
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
  org_id_var uuid;
BEGIN
  SELECT u.organization_id INTO org_id_var FROM public.users u WHERE u.id = auth.uid();
  
  IF org_id_var IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    COALESCE(SUM(ii.current_stock * COALESCE(ii.unit_cost, 0)), 0),
    COUNT(ii.id)::bigint,
    COUNT(*) FILTER (WHERE ii.current_stock <= COALESCE(ii.reorder_point, 10))::bigint,
    COUNT(*) FILTER (WHERE ii.current_stock >= COALESCE(ii.max_stock_level, 1000))::bigint
  FROM public.teams t
  LEFT JOIN public.inventory_items ii ON ii.team_id = t.id AND ii.organization_id = org_id_var AND ii.is_active = true
  WHERE t.organization_id = org_id_var
    AND t.is_active = true
    AND (p_team_id IS NULL OR t.id = p_team_id)
  GROUP BY t.id, t.name
  ORDER BY t.name;
END;
$$;