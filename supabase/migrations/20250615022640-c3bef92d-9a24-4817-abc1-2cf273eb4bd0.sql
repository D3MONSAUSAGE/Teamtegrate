
-- First, let's audit and clean up the existing RLS policies
-- We need to drop the overly permissive policies and create more restrictive ones

-- Drop existing overly permissive policies if they exist
DROP POLICY IF EXISTS "Users can view organization tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view organization projects" ON public.projects;
DROP POLICY IF EXISTS "Organization members can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Organization members can view all projects" ON public.projects;

-- Create more restrictive task access policies
-- Users can only see tasks they created, are assigned to, or are part of the project team
CREATE POLICY "Users can view authorized tasks only" ON public.tasks
FOR SELECT USING (
  auth.uid()::text = user_id OR  -- Tasks they created
  auth.uid()::text = assigned_to_id OR  -- Tasks assigned to them individually
  auth.uid()::text = ANY(assigned_to_ids) OR  -- Tasks assigned to them in array
  (
    -- Tasks in projects where they are team members
    project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.project_team_members ptm
      WHERE ptm.project_id = tasks.project_id 
      AND ptm.user_id = auth.uid()
    )
  ) OR
  (
    -- Tasks in projects they manage
    project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id 
      AND p.manager_id = auth.uid()::text
    )
  ) OR
  (
    -- Admin and superadmin can see all tasks in their organization
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.organization_id = tasks.organization_id
      AND u.role IN ('admin', 'superadmin')
    )
  )
);

-- Create more restrictive project access policies  
-- Users can only see projects they manage or are team members of
CREATE POLICY "Users can view authorized projects only" ON public.projects
FOR SELECT USING (
  auth.uid()::text = manager_id OR  -- Projects they manage
  auth.uid() = ANY(team_members) OR  -- Projects where they are team members
  EXISTS (
    -- Projects where they are explicitly added as team members
    SELECT 1 FROM public.project_team_members ptm
    WHERE ptm.project_id = projects.id 
    AND ptm.user_id = auth.uid()
  ) OR
  (
    -- Admin and superadmin can see all projects in their organization
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.organization_id = projects.organization_id
      AND u.role IN ('admin', 'superadmin')
    )
  )
);

-- Ensure other CRUD operations follow the same authorization logic
CREATE POLICY "Users can insert tasks" ON public.tasks
FOR INSERT WITH CHECK (
  auth.uid()::text = user_id AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.organization_id = tasks.organization_id
  )
);

CREATE POLICY "Users can update authorized tasks" ON public.tasks
FOR UPDATE USING (
  auth.uid()::text = user_id OR  -- Tasks they created
  auth.uid()::text = assigned_to_id OR  -- Tasks assigned to them
  auth.uid()::text = ANY(assigned_to_ids) OR  -- Tasks assigned to them in array
  (
    -- Tasks in projects they manage
    project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id 
      AND p.manager_id = auth.uid()::text
    )
  ) OR
  (
    -- Admin and superadmin can update all tasks in their organization
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.organization_id = tasks.organization_id
      AND u.role IN ('admin', 'superadmin')
    )
  )
);

CREATE POLICY "Users can delete authorized tasks" ON public.tasks
FOR DELETE USING (
  auth.uid()::text = user_id OR  -- Tasks they created
  (
    -- Tasks in projects they manage
    project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id 
      AND p.manager_id = auth.uid()::text
    )
  ) OR
  (
    -- Admin and superadmin can delete all tasks in their organization
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.organization_id = tasks.organization_id
      AND u.role IN ('admin', 'superadmin')
    )
  )
);

-- Project CRUD policies
CREATE POLICY "Users can insert projects" ON public.projects
FOR INSERT WITH CHECK (
  auth.uid()::text = manager_id AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.organization_id = projects.organization_id
  )
);

CREATE POLICY "Users can update authorized projects" ON public.projects
FOR UPDATE USING (
  auth.uid()::text = manager_id OR  -- Projects they manage
  (
    -- Admin and superadmin can update all projects in their organization
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.organization_id = projects.organization_id
      AND u.role IN ('admin', 'superadmin')
    )
  )
);

CREATE POLICY "Users can delete authorized projects" ON public.projects
FOR DELETE USING (
  auth.uid()::text = manager_id OR  -- Projects they manage
  (
    -- Admin and superadmin can delete all projects in their organization
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.organization_id = projects.organization_id
      AND u.role IN ('admin', 'superadmin')
    )
  )
);

-- Add security audit logging function
CREATE OR REPLACE FUNCTION public.log_data_access(
  table_name TEXT,
  action_type TEXT,
  record_count INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Log data access for security auditing
  RAISE LOG 'DATA_ACCESS: User % (role: %) accessed % records from % via %',
    auth.uid(),
    (SELECT role FROM public.users WHERE id = auth.uid()),
    record_count,
    table_name,
    action_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
