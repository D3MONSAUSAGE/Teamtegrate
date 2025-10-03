-- Create production_recipes table
CREATE TABLE IF NOT EXISTS public.production_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  output_quantity NUMERIC NOT NULL CHECK (output_quantity > 0),
  output_unit TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create recipe_ingredients table
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.production_recipes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  quantity_needed NUMERIC NOT NULL CHECK (quantity_needed > 0),
  unit TEXT NOT NULL,
  manual_unit_cost NUMERIC CHECK (manual_unit_cost >= 0),
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create inventory_price_history table for tracking price changes
CREATE TABLE IF NOT EXISTS public.inventory_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  old_purchase_price NUMERIC,
  new_purchase_price NUMERIC,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_source TEXT DEFAULT 'manual_edit'
);

-- Enable RLS
ALTER TABLE public.production_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for production_recipes
CREATE POLICY "Users can view their own recipes"
  ON public.production_recipes FOR SELECT
  USING (user_id = auth.uid() AND organization_id = public.get_current_user_organization_id());

CREATE POLICY "Users can create their own recipes"
  ON public.production_recipes FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id = public.get_current_user_organization_id());

CREATE POLICY "Users can update their own recipes"
  ON public.production_recipes FOR UPDATE
  USING (user_id = auth.uid() AND organization_id = public.get_current_user_organization_id());

CREATE POLICY "Users can delete their own recipes"
  ON public.production_recipes FOR DELETE
  USING (user_id = auth.uid() AND organization_id = public.get_current_user_organization_id());

-- RLS Policies for recipe_ingredients
CREATE POLICY "Users can view ingredients of their recipes"
  ON public.recipe_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.production_recipes
    WHERE production_recipes.id = recipe_ingredients.recipe_id
      AND production_recipes.user_id = auth.uid()
      AND production_recipes.organization_id = public.get_current_user_organization_id()
  ));

CREATE POLICY "Users can add ingredients to their recipes"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.production_recipes
    WHERE production_recipes.id = recipe_ingredients.recipe_id
      AND production_recipes.user_id = auth.uid()
      AND production_recipes.organization_id = public.get_current_user_organization_id()
  ));

CREATE POLICY "Users can update ingredients of their recipes"
  ON public.recipe_ingredients FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.production_recipes
    WHERE production_recipes.id = recipe_ingredients.recipe_id
      AND production_recipes.user_id = auth.uid()
      AND production_recipes.organization_id = public.get_current_user_organization_id()
  ));

CREATE POLICY "Users can delete ingredients of their recipes"
  ON public.recipe_ingredients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.production_recipes
    WHERE production_recipes.id = recipe_ingredients.recipe_id
      AND production_recipes.user_id = auth.uid()
      AND production_recipes.organization_id = public.get_current_user_organization_id()
  ));

-- RLS Policies for inventory_price_history
CREATE POLICY "Users can view price history in their organization"
  ON public.inventory_price_history FOR SELECT
  USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "System can insert price history"
  ON public.inventory_price_history FOR INSERT
  WITH CHECK (organization_id = public.get_current_user_organization_id());

-- Create trigger function to track inventory price changes
CREATE OR REPLACE FUNCTION public.track_inventory_price_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if purchase_price actually changed
  IF OLD.purchase_price IS DISTINCT FROM NEW.purchase_price THEN
    INSERT INTO public.inventory_price_history (
      organization_id,
      item_id,
      old_purchase_price,
      new_purchase_price,
      changed_by,
      changed_at,
      change_source
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      OLD.purchase_price,
      NEW.purchase_price,
      auth.uid(),
      now(),
      'manual_edit'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on inventory_items
DROP TRIGGER IF EXISTS track_price_changes ON public.inventory_items;
CREATE TRIGGER track_price_changes
  AFTER UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.track_inventory_price_changes();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_production_recipes_user_org ON public.production_recipes(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_production_recipes_org ON public.production_recipes(organization_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_item ON public.recipe_ingredients(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_price_history_item ON public.inventory_price_history(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_price_history_org ON public.inventory_price_history(organization_id);

-- Update trigger for production_recipes
CREATE TRIGGER update_production_recipes_updated_at
  BEFORE UPDATE ON public.production_recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();