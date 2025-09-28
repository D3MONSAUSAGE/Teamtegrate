-- Create warehouse_item_settings table for day-of-week specific reorder levels
CREATE TABLE public.warehouse_item_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  item_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  reorder_min INTEGER DEFAULT 0,
  reorder_max INTEGER DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(warehouse_id, item_id, day_of_week),
  CHECK (reorder_min >= 0),
  CHECK (reorder_max >= reorder_min)
);

-- Enable RLS
ALTER TABLE public.warehouse_item_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view settings in their organization" 
ON public.warehouse_item_settings 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create settings in their organization" 
ON public.warehouse_item_settings 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update settings in their organization" 
ON public.warehouse_item_settings 
FOR UPDATE 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can delete settings" 
ON public.warehouse_item_settings 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

-- Create function to get current day's reorder levels for an item
CREATE OR REPLACE FUNCTION public.get_item_reorder_levels(
  p_warehouse_id UUID,
  p_item_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(reorder_min INTEGER, reorder_max INTEGER)
LANGUAGE plpgsql
STABLE
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

-- Create trigger for updated_at
CREATE TRIGGER update_warehouse_item_settings_updated_at
  BEFORE UPDATE ON public.warehouse_item_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_warehouse_item_settings_warehouse_item ON public.warehouse_item_settings(warehouse_id, item_id);
CREATE INDEX idx_warehouse_item_settings_day ON public.warehouse_item_settings(day_of_week);
CREATE INDEX idx_warehouse_item_settings_org ON public.warehouse_item_settings(organization_id);