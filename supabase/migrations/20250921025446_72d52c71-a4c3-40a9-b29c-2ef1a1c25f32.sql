-- Create inventory categories table for admin-configurable categories
CREATE TABLE public.inventory_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Create inventory units table for admin-configurable units of measure
CREATE TABLE public.inventory_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('weight', 'volume', 'count', 'length', 'area')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name),
  UNIQUE(organization_id, abbreviation)
);

-- Insert default categories for each organization
INSERT INTO public.inventory_categories (organization_id, name, description) 
SELECT DISTINCT organization_id, 'Raw Materials', 'Basic ingredients and raw materials' 
FROM public.inventory_items;

INSERT INTO public.inventory_categories (organization_id, name, description) 
SELECT DISTINCT organization_id, 'Finished Goods', 'Completed products ready for sale' 
FROM public.inventory_items;

INSERT INTO public.inventory_categories (organization_id, name, description) 
SELECT DISTINCT organization_id, 'Supplies', 'Operating supplies and materials' 
FROM public.inventory_items;

INSERT INTO public.inventory_categories (organization_id, name, description) 
SELECT DISTINCT organization_id, 'Equipment', 'Tools and equipment' 
FROM public.inventory_items;

-- Insert default units of measure for each organization
INSERT INTO public.inventory_units (organization_id, name, abbreviation, unit_type)
SELECT DISTINCT organization_id, 'Pounds', 'lbs', 'weight' FROM public.inventory_items;

INSERT INTO public.inventory_units (organization_id, name, abbreviation, unit_type)
SELECT DISTINCT organization_id, 'Kilograms', 'kg', 'weight' FROM public.inventory_items;

INSERT INTO public.inventory_units (organization_id, name, abbreviation, unit_type)
SELECT DISTINCT organization_id, 'Grams', 'g', 'weight' FROM public.inventory_items;

INSERT INTO public.inventory_units (organization_id, name, abbreviation, unit_type)
SELECT DISTINCT organization_id, 'Ounces', 'oz', 'weight' FROM public.inventory_items;

INSERT INTO public.inventory_units (organization_id, name, abbreviation, unit_type)
SELECT DISTINCT organization_id, 'Gallons', 'gal', 'volume' FROM public.inventory_items;

INSERT INTO public.inventory_units (organization_id, name, abbreviation, unit_type)
SELECT DISTINCT organization_id, 'Liters', 'L', 'volume' FROM public.inventory_items;

INSERT INTO public.inventory_units (organization_id, name, abbreviation, unit_type)
SELECT DISTINCT organization_id, 'Each', 'ea', 'count' FROM public.inventory_items;

INSERT INTO public.inventory_units (organization_id, name, abbreviation, unit_type)
SELECT DISTINCT organization_id, 'Boxes', 'box', 'count' FROM public.inventory_items;

INSERT INTO public.inventory_units (organization_id, name, abbreviation, unit_type)
SELECT DISTINCT organization_id, 'Cases', 'case', 'count' FROM public.inventory_items;

-- Drop the RLS policy that depends on team_id before dropping the column
DROP POLICY IF EXISTS "Users can view items in their organization" ON public.inventory_items;

-- Remove team_id column as it belongs in templates, not master items
ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS team_id;

-- Add new columns to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN category_id UUID REFERENCES public.inventory_categories(id),
ADD COLUMN base_unit_id UUID REFERENCES public.inventory_units(id),
ADD COLUMN purchase_unit TEXT,
ADD COLUMN conversion_factor DECIMAL(10,4),
ADD COLUMN purchase_price DECIMAL(10,2),
ADD COLUMN calculated_unit_price DECIMAL(10,4) GENERATED ALWAYS AS (
  CASE 
    WHEN conversion_factor > 0 AND purchase_price > 0 
    THEN purchase_price / conversion_factor 
    ELSE NULL 
  END
) STORED;

-- Recreate the RLS policy without team_id dependency
CREATE POLICY "Users can view items in their organization" 
ON public.inventory_items 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

-- Enable RLS on new tables
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_units ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_categories
CREATE POLICY "Users can view categories in their organization" 
ON public.inventory_categories 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Admins can manage categories" 
ON public.inventory_categories 
FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'manager')
  )
);

-- RLS policies for inventory_units
CREATE POLICY "Users can view units in their organization" 
ON public.inventory_units 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Admins can manage units" 
ON public.inventory_units 
FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'manager')
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_inventory_categories_updated_at
BEFORE UPDATE ON public.inventory_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_units_updated_at
BEFORE UPDATE ON public.inventory_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();