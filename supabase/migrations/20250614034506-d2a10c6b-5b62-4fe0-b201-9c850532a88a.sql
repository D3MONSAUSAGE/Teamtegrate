
-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create team memberships table
CREATE TABLE public.team_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'manager', 'member'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Add RLS policies for teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teams in their organization"
  ON public.teams
  FOR SELECT
  USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Superadmins and admins can create teams"
  ON public.teams
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Superadmins and admins can update teams"
  ON public.teams
  FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Superadmins and admins can delete teams"
  ON public.teams
  FOR DELETE
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin')
    )
  );

-- Add RLS policies for team memberships table
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team memberships in their organization"
  ON public.team_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.users u ON u.organization_id = t.organization_id
      WHERE t.id = team_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "Superadmins and admins can manage team memberships"
  ON public.team_memberships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.users u ON u.organization_id = t.organization_id
      WHERE t.id = team_id 
      AND u.id = auth.uid() 
      AND u.role IN ('superadmin', 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_teams_organization_id ON public.teams(organization_id);
CREATE INDEX idx_teams_manager_id ON public.teams(manager_id);
CREATE INDEX idx_team_memberships_team_id ON public.team_memberships(team_id);
CREATE INDEX idx_team_memberships_user_id ON public.team_memberships(user_id);

-- Create a view for team details with member counts
CREATE VIEW public.team_details AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.manager_id,
  t.organization_id,
  t.created_at,
  t.updated_at,
  t.is_active,
  u.name as manager_name,
  u.email as manager_email,
  COALESCE(tm.member_count, 0) as member_count
FROM public.teams t
LEFT JOIN public.users u ON t.manager_id = u.id
LEFT JOIN (
  SELECT team_id, COUNT(*) as member_count
  FROM public.team_memberships
  GROUP BY team_id
) tm ON t.id = tm.team_id;

-- Function to get team statistics for an organization
CREATE OR REPLACE FUNCTION public.get_team_stats(org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_teams', (SELECT COUNT(*) FROM teams WHERE organization_id = org_id AND is_active = true),
    'teams_with_managers', (SELECT COUNT(*) FROM teams WHERE organization_id = org_id AND manager_id IS NOT NULL AND is_active = true),
    'total_team_members', (
      SELECT COUNT(*) FROM team_memberships tm
      JOIN teams t ON tm.team_id = t.id
      WHERE t.organization_id = org_id AND t.is_active = true
    ),
    'average_team_size', (
      SELECT COALESCE(AVG(member_count), 0) FROM (
        SELECT COUNT(*) as member_count FROM team_memberships tm
        JOIN teams t ON tm.team_id = t.id
        WHERE t.organization_id = org_id AND t.is_active = true
        GROUP BY t.id
      ) team_sizes
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;
