-- Create recipe_cost_categories table (organization-wide reusable categories)
CREATE TABLE IF NOT EXISTS public.recipe_cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Create recipe_other_costs table (costs per recipe)
CREATE TABLE IF NOT EXISTS public.recipe_other_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.production_recipes(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.recipe_cost_categories(id) ON DELETE RESTRICT,
  cost_amount NUMERIC(10, 2) NOT NULL CHECK (cost_amount >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, category_id)
);

-- Enable RLS
ALTER TABLE public.recipe_cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_other_costs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipe_cost_categories
CREATE POLICY "Users can view categories in their organization"
  ON public.recipe_cost_categories
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create categories in their organization"
  ON public.recipe_cost_categories
  FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update categories in their organization"
  ON public.recipe_cost_categories
  FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete categories in their organization"
  ON public.recipe_cost_categories
  FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

-- RLS Policies for recipe_other_costs
CREATE POLICY "Users can view other costs for recipes in their organization"
  ON public.recipe_other_costs
  FOR SELECT
  USING (recipe_id IN (
    SELECT id FROM public.production_recipes 
    WHERE organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can create other costs for recipes in their organization"
  ON public.recipe_other_costs
  FOR INSERT
  WITH CHECK (recipe_id IN (
    SELECT id FROM public.production_recipes 
    WHERE organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can update other costs for recipes in their organization"
  ON public.recipe_other_costs
  FOR UPDATE
  USING (recipe_id IN (
    SELECT id FROM public.production_recipes 
    WHERE organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete other costs for recipes in their organization"
  ON public.recipe_other_costs
  FOR DELETE
  USING (recipe_id IN (
    SELECT id FROM public.production_recipes 
    WHERE organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  ));

-- Create indexes for better performance
CREATE INDEX idx_recipe_cost_categories_org ON public.recipe_cost_categories(organization_id);
CREATE INDEX idx_recipe_other_costs_recipe ON public.recipe_other_costs(recipe_id);
CREATE INDEX idx_recipe_other_costs_category ON public.recipe_other_costs(category_id);

-- Add trigger for updated_at on recipe_cost_categories
CREATE TRIGGER update_recipe_cost_categories_updated_at
  BEFORE UPDATE ON public.recipe_cost_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();