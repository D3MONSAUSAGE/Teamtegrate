-- Create team_item_pricing table for location-specific pricing
CREATE TABLE IF NOT EXISTS public.team_item_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  purchase_price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  unit_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(team_id, item_id)
);

-- Enable RLS
ALTER TABLE public.team_item_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view team pricing in their organization"
  ON public.team_item_pricing
  FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Team members can update their team pricing"
  ON public.team_item_pricing
  FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id() AND
    (
      EXISTS (
        SELECT 1 FROM team_memberships
        WHERE team_id = team_item_pricing.team_id
        AND user_id = auth.uid()
      ) OR
      get_current_user_role() IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Team members can insert their team pricing"
  ON public.team_item_pricing
  FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    created_by = auth.uid() AND
    (
      EXISTS (
        SELECT 1 FROM team_memberships
        WHERE team_id = team_item_pricing.team_id
        AND user_id = auth.uid()
      ) OR
      get_current_user_role() IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Team members can delete their team pricing"
  ON public.team_item_pricing
  FOR DELETE
  USING (
    organization_id = get_current_user_organization_id() AND
    (
      EXISTS (
        SELECT 1 FROM team_memberships
        WHERE team_id = team_item_pricing.team_id
        AND user_id = auth.uid()
      ) OR
      get_current_user_role() IN ('admin', 'superadmin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_team_item_pricing_updated_at
  BEFORE UPDATE ON public.team_item_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_team_item_pricing_team_item ON public.team_item_pricing(team_id, item_id);
CREATE INDEX idx_team_item_pricing_org ON public.team_item_pricing(organization_id);