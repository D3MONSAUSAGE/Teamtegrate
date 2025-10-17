-- Update RLS policy for production_recipes to allow admins to create recipes for any team
-- This ensures admins can create recipes even when working across multiple teams

DROP POLICY IF EXISTS "Team members can create recipes for their teams" ON production_recipes;

CREATE POLICY "Team members and admins can create recipes"
ON production_recipes FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND (
    -- Admins and superadmins can create recipes for any team in their org
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    -- Team members can create recipes for their own teams
    team_id IN (
      SELECT team_id FROM team_memberships 
      WHERE user_id = auth.uid()
    )
  )
);