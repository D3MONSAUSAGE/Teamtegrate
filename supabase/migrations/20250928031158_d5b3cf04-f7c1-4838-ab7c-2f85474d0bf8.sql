-- Drop and recreate functions to fix wac_unit_cost references

-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_real_time_inventory_value(uuid);

-- Recreate get_real_time_inventory_value function with unit_cost from inventory_items
CREATE OR REPLACE FUNCTION public.get_real_time_inventory_value(team_id_param uuid DEFAULT NULL::uuid)
RETURNS TABLE(
    team_id uuid,
    team_name text,
    item_id uuid,
    item_name text,
    current_stock integer,
    unit_cost numeric,
    total_value numeric,
    reorder_point integer,
    max_stock_level integer,
    last_updated timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        wi.team_id,
        t.name as team_name,
        wi.item_id,
        ii.name as item_name,
        wi.current_stock,
        ii.unit_cost, -- Use unit_cost from inventory_items instead of removed wac_unit_cost
        (wi.current_stock * ii.unit_cost) as total_value,
        wi.reorder_point,
        wi.max_stock_level,
        wi.updated_at as last_updated
    FROM warehouse_items wi
    JOIN inventory_items ii ON wi.item_id = ii.id
    JOIN teams t ON wi.team_id = t.id
    WHERE wi.organization_id = get_current_user_organization_id()
    AND (team_id_param IS NULL OR wi.team_id = team_id_param)
    AND wi.current_stock > 0
    ORDER BY t.name, ii.name;
END;
$function$;