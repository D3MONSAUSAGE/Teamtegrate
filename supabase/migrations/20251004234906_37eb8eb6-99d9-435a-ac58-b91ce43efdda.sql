-- Phase 1: Simplify RLS Policies on employee_schedules (Correct UUID handling)

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all schedules" ON employee_schedules;
DROP POLICY IF EXISTS "Managers can update team schedules" ON employee_schedules;
DROP POLICY IF EXISTS "Managers can view team schedules" ON employee_schedules;
DROP POLICY IF EXISTS "Users can view their own schedules" ON employee_schedules;
DROP POLICY IF EXISTS "Admins and managers can insert schedules" ON employee_schedules;
DROP POLICY IF EXISTS "Admins can insert schedules" ON employee_schedules;
DROP POLICY IF EXISTS "Managers can insert schedules" ON employee_schedules;
DROP POLICY IF EXISTS "Admins can delete schedules" ON employee_schedules;
DROP POLICY IF EXISTS "Managers can delete schedules" ON employee_schedules;
DROP POLICY IF EXISTS "Managers can delete team schedules" ON employee_schedules;

-- Create 4 clear, non-overlapping policies

-- SELECT: Who can view schedules
CREATE POLICY "select_employee_schedules" ON employee_schedules
FOR SELECT USING (
  organization_id = get_current_user_organization_id() AND (
    -- Users see their own schedules
    employee_id = auth.uid()
    -- Managers see their team members' schedules  
    OR EXISTS (
      SELECT 1 FROM team_memberships tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = employee_schedules.employee_id
        AND t.manager_id = auth.uid()
    )
    -- Admins/superadmins/managers see all in org
    OR get_current_user_role() IN ('admin', 'superadmin', 'manager')
  )
);

-- INSERT: Who can create schedules
CREATE POLICY "insert_employee_schedules" ON employee_schedules
FOR INSERT WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  created_by = auth.uid() AND
  get_current_user_role() IN ('manager', 'admin', 'superadmin')
);

-- UPDATE: Who can update schedules
CREATE POLICY "update_employee_schedules" ON employee_schedules
FOR UPDATE USING (
  organization_id = get_current_user_organization_id() AND (
    -- Managers/admins can update any field
    get_current_user_role() IN ('manager', 'admin', 'superadmin')
    -- Employees can update their own schedules
    OR employee_id = auth.uid()
  )
);

-- DELETE: Who can delete schedules  
CREATE POLICY "delete_employee_schedules" ON employee_schedules
FOR DELETE USING (
  organization_id = get_current_user_organization_id() AND
  get_current_user_role() IN ('manager', 'admin', 'superadmin')
);