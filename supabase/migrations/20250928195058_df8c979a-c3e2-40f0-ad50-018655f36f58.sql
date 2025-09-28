-- Fix database functions to use correct warehouse settings system with proper threshold priority

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_real_time_inventory_value(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_team_inventory_summary(uuid, uuid);

-- Recreate get_real_time_inventory_value with correct warehouse settings logic
CREATE OR REPLACE FUNCTION public.get_real_time_inventory_value(
  p_organization_id uuid,
  p_team_id uuid DEFAULT NULL,
  p_warehouse_id uuid DEFAULT NULL
)
RETURNS TABLE (
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
  current_day text;
BEGIN
  -- Get current day of week (lowercase)
  current_day := lower(to_char(now(), 'Day'));
  current_day := trim(current_day);
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(wi.on_hand * ii.unit_cost), 0) as total_value,
    COUNT(wi.id) as item_count,
    COUNT(CASE 
      WHEN wi.on_hand <= COALESCE(
        CASE current_day
          WHEN 'monday' THEN wis.monday_reorder_min
          WHEN 'tuesday' THEN wis.tuesday_reorder_min
          WHEN 'wednesday' THEN wis.wednesday_reorder_min
          WHEN 'thursday' THEN wis.thursday_reorder_min
          WHEN 'friday' THEN wis.friday_reorder_min
          WHEN 'saturday' THEN wis.saturday_reorder_min
          WHEN 'sunday' THEN wis.sunday_reorder_min
        END,
        wi.reorder_min,
        iti.minimum_quantity
      ) THEN 1 
    END) as low_stock_items,
    COUNT(CASE 
      WHEN wi.on_hand >= COALESCE(
        CASE current_day
          WHEN 'monday' THEN wis.monday_reorder_max
          WHEN 'tuesday' THEN wis.tuesday_reorder_max
          WHEN 'wednesday' THEN wis.wednesday_reorder_max
          WHEN 'thursday' THEN wis.thursday_reorder_max
          WHEN 'friday' THEN wis.friday_reorder_max
          WHEN 'saturday' THEN wis.saturday_reorder_max
          WHEN 'sunday' THEN wis.sunday_reorder_max
        END,
        wi.reorder_max,
        iti.maximum_quantity
      ) THEN 1 
    END) as overstock_items
  FROM warehouse_items wi
  JOIN inventory_items ii ON wi.item_id = ii.id
  JOIN warehouses w ON wi.warehouse_id = w.id
  LEFT JOIN warehouse_item_settings wis ON wi.id = wis.warehouse_item_id
  LEFT JOIN team_inventory_assignments tia ON w.team_id = tia.team_id AND tia.is_active = true
  LEFT JOIN inventory_template_items iti ON tia.template_id = iti.template_id AND iti.item_id = wi.item_id
  WHERE w.organization_id = p_organization_id
    AND (p_team_id IS NULL OR w.team_id = p_team_id)
    AND (p_warehouse_id IS NULL OR wi.warehouse_id = p_warehouse_id);
END;
$$;

-- Recreate get_team_inventory_summary with correct warehouse settings logic
CREATE OR REPLACE FUNCTION public.get_team_inventory_summary(
  p_organization_id uuid,
  p_team_id uuid DEFAULT NULL
)
RETURNS TABLE (
  team_name text,
  total_items bigint,
  low_stock_items bigint,
  out_of_stock_count bigint,
  total_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_day text;
BEGIN
  -- Get current day of week (lowercase)
  current_day := lower(to_char(now(), 'Day'));
  current_day := trim(current_day);
  
  RETURN QUERY
  SELECT 
    t.name as team_name,
    COUNT(wi.id) as total_items,
    COUNT(CASE 
      WHEN wi.on_hand <= COALESCE(
        CASE current_day
          WHEN 'monday' THEN wis.monday_reorder_min
          WHEN 'tuesday' THEN wis.tuesday_reorder_min
          WHEN 'wednesday' THEN wis.wednesday_reorder_min
          WHEN 'thursday' THEN wis.thursday_reorder_min
          WHEN 'friday' THEN wis.friday_reorder_min
          WHEN 'saturday' THEN wis.saturday_reorder_min
          WHEN 'sunday' THEN wis.sunday_reorder_min
        END,
        wi.reorder_min,
        iti.minimum_quantity
      ) THEN 1 
    END) as low_stock_items,
    COUNT(CASE WHEN wi.on_hand = 0 THEN 1 END) as out_of_stock_count,
    COALESCE(SUM(wi.on_hand * ii.unit_cost), 0) as total_value
  FROM teams t
  LEFT JOIN warehouses w ON t.id = w.team_id
  LEFT JOIN warehouse_items wi ON w.id = wi.warehouse_id
  LEFT JOIN inventory_items ii ON wi.item_id = ii.id
  LEFT JOIN warehouse_item_settings wis ON wi.id = wis.warehouse_item_id
  LEFT JOIN team_inventory_assignments tia ON t.id = tia.team_id AND tia.is_active = true
  LEFT JOIN inventory_template_items iti ON tia.template_id = iti.template_id AND iti.item_id = wi.item_id
  WHERE t.organization_id = p_organization_id
    AND t.is_active = true
    AND (p_team_id IS NULL OR t.id = p_team_id)
  GROUP BY t.id, t.name
  ORDER BY t.name;
END;
$$;