-- Create team_item_visibility table to track hidden items per team
CREATE TABLE public.team_item_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  hidden_at TIMESTAMP WITH TIME ZONE,
  hidden_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, item_id)
);

-- Create indexes for performance
CREATE INDEX idx_team_item_visibility_team ON public.team_item_visibility(team_id);
CREATE INDEX idx_team_item_visibility_item ON public.team_item_visibility(item_id);
CREATE INDEX idx_team_item_visibility_org ON public.team_item_visibility(organization_id);

-- Enable RLS
ALTER TABLE public.team_item_visibility ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view visibility settings in their organization"
  ON public.team_item_visibility
  FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Team members can manage visibility for their team"
  ON public.team_item_visibility
  FOR ALL
  USING (
    organization_id = get_current_user_organization_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.team_memberships
        WHERE team_id = team_item_visibility.team_id
        AND user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
      )
    )
  )
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.team_memberships
        WHERE team_id = team_item_visibility.team_id
        AND user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
      )
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_team_item_visibility_updated_at
  BEFORE UPDATE ON public.team_item_visibility
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();