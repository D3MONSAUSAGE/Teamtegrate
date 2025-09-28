-- Fix search path for the get_item_reorder_levels function
CREATE OR REPLACE FUNCTION public.get_item_reorder_levels(
  p_warehouse_id UUID,
  p_item_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(reorder_min INTEGER, reorder_max INTEGER)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  day_of_week INTEGER;
  settings_min INTEGER;
  settings_max INTEGER;
  default_min INTEGER := 0;
  default_max INTEGER := 100;
BEGIN
  -- Get day of week (0=Sunday, 6=Saturday)
  day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Try to get day-specific settings
  SELECT ws.reorder_min, ws.reorder_max
  INTO settings_min, settings_max
  FROM public.warehouse_item_settings ws
  WHERE ws.warehouse_id = p_warehouse_id
    AND ws.item_id = p_item_id
    AND ws.day_of_week = day_of_week
    AND ws.is_active = true;
  
  -- If no day-specific settings, try to get from warehouse_items table
  IF settings_min IS NULL THEN
    SELECT wi.reorder_point, wi.max_stock_level
    INTO settings_min, settings_max
    FROM public.inventory_warehouse_items wi
    WHERE wi.warehouse_id = p_warehouse_id
      AND wi.item_id = p_item_id;
  END IF;
  
  -- Return with defaults if still null
  RETURN QUERY SELECT 
    COALESCE(settings_min, default_min) as reorder_min,
    COALESCE(settings_max, default_max) as reorder_max;
END;
$function$;