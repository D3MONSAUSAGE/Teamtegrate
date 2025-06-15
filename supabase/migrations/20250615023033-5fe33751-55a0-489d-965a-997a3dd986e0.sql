
-- Step 1: Create security definer functions to avoid infinite recursion

-- Function to check if user can access a specific project
CREATE OR REPLACE FUNCTION public.can_user_access_project(project_id_param TEXT, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
  user_org_id UUID;
  project_manager_id TEXT;
  project_org_id UUID;
  is_team_member BOOLEAN := FALSE;
BEGIN
  -- Get user info
  SELECT role, organization_id INTO user_role, user_org_id
  FROM public.users 
  WHERE id = user_id_param;
  
  -- Get project info
  SELECT manager_id, organization_id INTO project_manager_id, project_org_id
  FROM public.projects 
  WHERE id = project_id_param;
  
  -- Check if user and project are in same organization
  IF user_org_id != project_org_id THEN
    RETURN FALSE;
  END IF;
  
  -- Admin and superadmin can access all projects in their org
  IF user_role IN ('admin', 'superadmin') THEN
    RETURN TRUE;
  END IF;
  
  -- Project manager can access
  IF project_manager_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is in team_members array
  IF EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id_param 
    AND user_id_param = ANY(team_members)
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is in project_team_members table
  IF EXISTS (
    SELECT 1 FROM public.project_team_members 
    WHERE project_id = project_id_param 
    AND user_id = user_id_param
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function to check if user can access a specific task
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
  task_project_id TEXT;
  task_org_id UUID;
BEGIN
  -- Get user info
  SELECT role, organization_id INTO user_role, user_org_id
  FROM public.users 
  WHERE id = user_id_param;
  
  -- Get task info
  SELECT user_id, assigned_to_id, assigned_to_ids, project_id, organization_id 
  INTO task_user_id, task_assigned_to_id, task_assigned_to_ids, task_project_id, task_org_id
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
  
  -- Task creator can access
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
  
  -- If task belongs to a project, check project access
  IF task_project_id IS NOT NULL THEN
    RETURN public.can_user_access_project(task_project_id, user_id_param);
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Step 2: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view authorized tasks only" ON public.tasks;
DROP POLICY IF EXISTS "Users can view authorized projects only" ON public.projects;
DROP POLICY IF EXISTS "Users can update authorized tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete authorized tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update authorized projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete authorized projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;

-- Step 3: Create new non-recursive policies using security definer functions

-- Task policies
CREATE POLICY "Users can view authorized tasks" ON public.tasks
FOR SELECT USING (
  public.can_user_access_task(id, auth.uid())
);

CREATE POLICY "Users can insert tasks" ON public.tasks
FOR INSERT WITH CHECK (
  auth.uid()::text = user_id AND
  organization_id = public.get_current_user_organization_id()
);

CREATE POLICY "Users can update authorized tasks" ON public.tasks
FOR UPDATE USING (
  public.can_user_access_task(id, auth.uid())
);

CREATE POLICY "Users can delete authorized tasks" ON public.tasks
FOR DELETE USING (
  auth.uid()::text = user_id OR
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
);

-- Project policies
CREATE POLICY "Users can view authorized projects" ON public.projects
FOR SELECT USING (
  public.can_user_access_project(id, auth.uid())
);

CREATE POLICY "Users can insert projects" ON public.projects
FOR INSERT WITH CHECK (
  auth.uid()::text = manager_id AND
  organization_id = public.get_current_user_organization_id()
);

CREATE POLICY "Users can update authorized projects" ON public.projects
FOR UPDATE USING (
  auth.uid()::text = manager_id OR
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
);

CREATE POLICY "Users can delete authorized projects" ON public.projects
FOR DELETE USING (
  auth.uid()::text = manager_id OR
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
);
