
-- Fix RLS policies for proper data isolation
-- Step 1: Drop existing overly permissive policies

-- Drop existing projects policies
DROP POLICY IF EXISTS "projects_select_organization_v2" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_organization_v2" ON public.projects;
DROP POLICY IF EXISTS "projects_update_managers_team_admins_v2" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_managers_admins_v2" ON public.projects;

-- Drop existing tasks policies
DROP POLICY IF EXISTS "tasks_select_organization_v2" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_organization_v2" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_creators_assigned_managers_admins_v2" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_creators_managers_admins_v2" ON public.tasks;

-- Step 2: Create secure projects policies
-- Users can only see projects they manage, are team members of, or if they're admin/superadmin
CREATE POLICY "projects_select_authorized_access_v3" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    -- Project manager can see the project
    manager_id = auth.uid()::text
    -- User is a team member of the project
    OR auth.uid() = ANY(team_members)
    -- User is admin or superadmin in their organization
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- Users can create projects in their organization
CREATE POLICY "projects_insert_organization_v3" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

-- Project managers, team members, and admins can update projects
CREATE POLICY "projects_update_authorized_v3" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    manager_id = auth.uid()::text
    OR auth.uid() = ANY(team_members)
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- Project managers and admins can delete projects
CREATE POLICY "projects_delete_authorized_v3" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    manager_id = auth.uid()::text
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- Step 3: Create secure tasks policies
-- Users can only see tasks assigned to them, in projects they have access to, or if admin/superadmin
CREATE POLICY "tasks_select_authorized_access_v3" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    -- Task is assigned to the user
    assigned_to_id = auth.uid()::text
    OR auth.uid()::text = ANY(assigned_to_ids)
    -- User created the task
    OR user_id = auth.uid()::text
    -- User has access to the project this task belongs to
    OR (
      project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = tasks.project_id 
        AND (
          p.manager_id = auth.uid()::text 
          OR auth.uid() = ANY(p.team_members)
        )
      )
    )
    -- User is admin or superadmin
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- Users can create tasks in their organization
CREATE POLICY "tasks_insert_organization_v3" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

-- Authorized users can update tasks
CREATE POLICY "tasks_update_authorized_v3" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()::text
    OR assigned_to_id = auth.uid()::text
    OR auth.uid()::text = ANY(assigned_to_ids)
    OR (
      project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = tasks.project_id 
        AND (
          p.manager_id = auth.uid()::text 
          OR auth.uid() = ANY(p.team_members)
        )
      )
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- Authorized users can delete tasks
CREATE POLICY "tasks_delete_authorized_v3" 
ON public.tasks 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()::text
    OR (
      project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = tasks.project_id 
        AND p.manager_id = auth.uid()::text
      )
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);
