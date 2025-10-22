-- Fix label templates RLS to recognize team managers
-- Drop the old policy that only checks users.role
DROP POLICY IF EXISTS "Managers can manage templates" ON public.label_templates;

-- Create new policy that checks both users.role AND team_memberships.role
CREATE POLICY "Managers can manage templates" ON public.label_templates
  FOR ALL USING (
    organization_id = get_current_user_organization_id() AND
    (
      -- Check if user has manager/admin/superadmin role in users table
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
      )
      OR
      -- Check if user is a manager in any team in the organization
      EXISTS (
        SELECT 1 FROM team_memberships tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = auth.uid()
        AND tm.role = 'manager'
        AND t.organization_id = get_current_user_organization_id()
      )
    )
  )
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    created_by = auth.uid() AND
    (
      -- Check if user has manager/admin/superadmin role in users table
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
      )
      OR
      -- Check if user is a manager in any team in the organization
      EXISTS (
        SELECT 1 FROM team_memberships tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = auth.uid()
        AND tm.role = 'manager'
        AND t.organization_id = get_current_user_organization_id()
      )
    )
  );