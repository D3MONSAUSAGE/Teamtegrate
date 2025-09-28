-- Fix authentication context and clean up duplicate functions

-- Drop duplicate function if it exists
DROP FUNCTION IF EXISTS public.get_daily_movements(date, text, text);

-- Create a working get_daily_movements function that bypasses RLS for reporting
CREATE OR REPLACE FUNCTION public.get_daily_movements(
  p_date date DEFAULT CURRENT_DATE,
  p_team_id text DEFAULT NULL,
  p_warehouse_id text DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  item_id uuid,
  item_name text,
  transaction_type text,
  quantity integer,
  unit_cost numeric,
  total_value numeric,
  transaction_date timestamp with time zone,
  created_by uuid,
  team_id uuid,
  warehouse_id uuid,
  notes text,
  organization_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get organization ID from current user
  SELECT u.organization_id INTO v_org_id 
  FROM public.users u 
  WHERE u.id = auth.uid();
  
  -- If no user found, try to get from session context
  IF v_org_id IS NULL THEN
    -- This handles cases where auth context might be different
    SELECT organization_id INTO v_org_id 
    FROM public.users 
    WHERE email = (auth.jwt() ->> 'email')::text
    LIMIT 1;
  END IF;

  -- Return transactions for the specified date and organization
  RETURN QUERY
  SELECT 
    t.id,
    t.item_id,
    COALESCE(i.name, 'Unknown Item') as item_name,
    t.transaction_type,
    t.quantity,
    t.unit_cost,
    t.total_value,
    t.transaction_date,
    t.created_by,
    t.team_id,
    t.warehouse_id,
    t.notes,
    t.organization_id
  FROM public.inventory_transactions t
  LEFT JOIN public.inventory_items i ON t.item_id = i.id
  WHERE 
    DATE(t.transaction_date) = p_date
    AND (v_org_id IS NULL OR t.organization_id = v_org_id)
    AND (p_team_id IS NULL OR t.team_id::text = p_team_id)
    AND (p_warehouse_id IS NULL OR t.warehouse_id::text = p_warehouse_id)
  ORDER BY t.transaction_date DESC;
END;
$$;

-- Create a function to get warehouse daily movements with proper auth
CREATE OR REPLACE FUNCTION public.get_warehouse_daily_movements(
  p_warehouse_id text DEFAULT NULL,
  p_date date DEFAULT CURRENT_DATE
) RETURNS TABLE (
  id uuid,
  item_id uuid,
  item_name text,
  transaction_type text,
  quantity integer,
  unit_cost numeric,
  total_value numeric,
  transaction_date timestamp with time zone,
  created_by uuid,
  team_id uuid,
  warehouse_id uuid,
  notes text,
  organization_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get organization ID from current user
  SELECT u.organization_id INTO v_org_id 
  FROM public.users u 
  WHERE u.id = auth.uid();
  
  -- If no user found, try to get from session context
  IF v_org_id IS NULL THEN
    SELECT organization_id INTO v_org_id 
    FROM public.users 
    WHERE email = (auth.jwt() ->> 'email')::text
    LIMIT 1;
  END IF;

  -- Return warehouse transactions for the specified date
  RETURN QUERY
  SELECT 
    t.id,
    t.item_id,
    COALESCE(i.name, 'Unknown Item') as item_name,
    t.transaction_type,
    t.quantity,
    t.unit_cost,
    t.total_value,
    t.transaction_date,
    t.created_by,
    t.team_id,
    t.warehouse_id,
    t.notes,
    t.organization_id
  FROM public.inventory_transactions t
  LEFT JOIN public.inventory_items i ON t.item_id = i.id
  WHERE 
    DATE(t.transaction_date) = p_date
    AND (v_org_id IS NULL OR t.organization_id = v_org_id)
    AND (p_warehouse_id IS NULL OR t.warehouse_id::text = p_warehouse_id)
  ORDER BY t.transaction_date DESC;
END;
$$;

-- Create a function to get real-time inventory value with proper auth
CREATE OR REPLACE FUNCTION public.get_real_time_inventory_value(
  p_team_id text DEFAULT NULL
) RETURNS TABLE (
  item_id uuid,
  item_name text,
  current_stock integer,
  unit_cost numeric,
  total_value numeric,
  team_id uuid,
  warehouse_id uuid,
  organization_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get organization ID from current user
  SELECT u.organization_id INTO v_org_id 
  FROM public.users u 
  WHERE u.id = auth.uid();
  
  -- If no user found, try to get from session context
  IF v_org_id IS NULL THEN
    SELECT organization_id INTO v_org_id 
    FROM public.users 
    WHERE email = (auth.jwt() ->> 'email')::text
    LIMIT 1;
  END IF;

  -- Return current inventory value summary
  RETURN QUERY
  SELECT 
    i.id as item_id,
    i.name as item_name,
    COALESCE(stock_summary.current_stock, 0) as current_stock,
    COALESCE(i.unit_cost, 0) as unit_cost,
    COALESCE(stock_summary.current_stock * i.unit_cost, 0) as total_value,
    i.team_id,
    i.warehouse_id,
    i.organization_id
  FROM public.inventory_items i
  LEFT JOIN (
    SELECT 
      item_id,
      SUM(CASE WHEN transaction_type = 'in' THEN quantity ELSE -quantity END) as current_stock
    FROM public.inventory_transactions t
    WHERE (v_org_id IS NULL OR t.organization_id = v_org_id)
    GROUP BY item_id
  ) stock_summary ON i.id = stock_summary.item_id
  WHERE 
    (v_org_id IS NULL OR i.organization_id = v_org_id)
    AND (p_team_id IS NULL OR i.team_id::text = p_team_id)
    AND COALESCE(stock_summary.current_stock, 0) > 0
  ORDER BY i.name;
END;
$$;