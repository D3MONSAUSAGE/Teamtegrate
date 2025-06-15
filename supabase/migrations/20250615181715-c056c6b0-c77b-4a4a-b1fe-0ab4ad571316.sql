
-- Phase 1 & 2: Complete RLS Policy Cleanup for Tasks and Projects (Fixed)
-- This will remove all conflicting policies causing loading delays and security issues

-- Step 1: Drop ALL existing conflicting policies on tasks table
DROP POLICY IF EXISTS "Users can view authorized tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update authorized tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete authorized tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view authorized tasks only" ON public.tasks;
DROP POLICY IF EXISTS "Users can update authorized tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete authorized tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_authorized_access_v3" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_organization_v3" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_authorized_v3" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_authorized_v3" ON public.tasks;
DROP POLICY IF EXISTS "tasks_org_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_org_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_org_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_org_delete" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_tasks_delete" ON public.tasks;

-- Step 2: Drop ALL existing conflicting policies on projects table
DROP POLICY IF EXISTS "Users can view authorized projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update authorized projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete authorized projects" ON public.projects;
DROP POLICY IF EXISTS "Users can only view accessible projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can update accessible projects" ON public.projects;
DROP POLICY IF EXISTS "Project managers and admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "projects_select_authorized_access_v3" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_organization_v3" ON public.projects;
DROP POLICY IF EXISTS "projects_update_authorized_v3" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_authorized_v3" ON public.projects;
DROP POLICY IF EXISTS "projects_org_select" ON public.projects;
DROP POLICY IF EXISTS "projects_org_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_org_update" ON public.projects;
DROP POLICY IF EXISTS "projects_org_delete" ON public.projects;

-- Step 3: Update can_user_access_task function to be STRICTLY restrictive (no project-based access)
CREATE OR REPLACE FUNCTION public.can_user_access_task(task_id_param TEXT, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
  user_org_id UUID;
  task_user_id TEXT;
  task_assigned_to_id TEXT;
  task_assigned_to_ids TEXT[];
  task_org_id UUID;
BEGIN
  -- Get user info
  SELECT role, organization_id INTO user_role, user_org_id
  FROM public.users 
  WHERE id = user_id_param;
  
  -- Get task info
  SELECT user_id, assigned_to_id, assigned_to_ids, organization_id 
  INTO task_user_id, task_assigned_to_id, task_assigned_to_ids, task_org_id
  FROM public.tasks 
  WHERE id = task_id_param;
  
  -- Check if user and task are in same organization
  IF user_org_id != task_org_id THEN
    RETURN FALSE;
  END IF;
  
  -- Admin and superadmin can access all tasks in their org
  IF user_role IN ('admin', 'superadmin') THEN
    RETURN TRUE;
  END IF;
  
  -- Task creator can access their own tasks
  IF task_user_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  -- Task assignee can access (single assignment)
  IF task_assigned_to_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  -- Task assignee can access (multiple assignment)
  IF task_assigned_to_ids IS NOT NULL AND user_id_param::text = ANY(task_assigned_to_ids) THEN
    RETURN TRUE;
  END IF;
  
  -- REMOVED: Project-based access that was causing data leakage
  -- Users can no longer see all tasks in projects they have access to
  
  RETURN FALSE;
END;
$$;

-- Step 4: Create NEW clean, strict RLS policies for tasks
CREATE POLICY "tasks_strict_select_only_assigned_or_created" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (public.can_user_access_task(id, auth.uid()));

CREATE POLICY "tasks_strict_insert_organization_check" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "tasks_strict_update_only_assigned_or_created" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (public.can_user_access_task(id, auth.uid()));

CREATE POLICY "tasks_strict_delete_only_creator_or_admin" 
ON public.tasks 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()::text
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- Step 5: Create NEW clean, strict RLS policies for projects  
CREATE POLICY "projects_strict_select_only_manager_team_admin" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (public.can_user_access_project(id, auth.uid()));

CREATE POLICY "projects_strict_insert_organization_check" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "projects_strict_update_only_manager_team_admin" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (public.can_user_access_project(id, auth.uid()));

CREATE POLICY "projects_strict_delete_only_manager_admin" 
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

-- Step 6: Add performance optimization indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_id ON public.tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON public.projects(manager_id);

-- Step 7: Create audit logging function (without the problematic triggers)
CREATE OR REPLACE FUNCTION public.log_data_access(table_name TEXT, operation TEXT, user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log access patterns for security monitoring
  RAISE LOG 'AUDIT: User % (role: %) accessed % table, operation: %',
    user_id,
    (SELECT role FROM public.users WHERE id = user_id),
    table_name,
    operation;
END;
$$;
