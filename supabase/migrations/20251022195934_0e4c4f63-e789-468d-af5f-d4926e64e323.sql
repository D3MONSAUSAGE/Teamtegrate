-- Add team_id column to label_templates for team isolation
ALTER TABLE public.label_templates 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- Backfill: Assign existing templates to creator's primary team
UPDATE public.label_templates lt
SET team_id = (
  SELECT tm.team_id 
  FROM team_memberships tm 
  WHERE tm.user_id = lt.created_by 
  LIMIT 1
)
WHERE team_id IS NULL;

-- Make team_id required
ALTER TABLE public.label_templates 
ALTER COLUMN team_id SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_label_templates_team_id ON public.label_templates(team_id);

-- Drop existing organization-wide policies
DROP POLICY IF EXISTS "Users can view templates in their organization" ON public.label_templates;
DROP POLICY IF EXISTS "Managers can manage templates" ON public.label_templates;

-- New SELECT policy: Users can only see templates for their teams
CREATE POLICY "Users can view templates in their teams" ON public.label_templates
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- New INSERT policy: Team managers can create templates for their team
CREATE POLICY "Team managers can create templates" ON public.label_templates
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    team_id IN (
      SELECT tm.team_id FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'manager'
    )
  );

-- New UPDATE policy: Team managers can update templates in their team
CREATE POLICY "Team managers can update templates" ON public.label_templates
  FOR UPDATE USING (
    team_id IN (
      SELECT tm.team_id FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'manager'
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT tm.team_id FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'manager'
    )
  );

-- New DELETE policy: Team managers can delete templates in their team
CREATE POLICY "Team managers can delete templates" ON public.label_templates
  FOR DELETE USING (
    team_id IN (
      SELECT tm.team_id FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'manager'
    )
  );

-- Admin override policy: Admins can manage all templates in organization
CREATE POLICY "Admins can manage all organization templates" ON public.label_templates
  FOR ALL USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );