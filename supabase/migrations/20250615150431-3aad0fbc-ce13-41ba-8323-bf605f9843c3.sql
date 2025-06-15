
-- Enable Row Level Security on the projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create a helper function to check if a user can access a project
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
  project_team_members UUID[];
BEGIN
  -- Get user info
  SELECT role, organization_id INTO user_role, user_org_id
  FROM public.users 
  WHERE id = user_id_param;
  
  -- Get project info
  SELECT manager_id, organization_id, team_members 
  INTO project_manager_id, project_org_id, project_team_members
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
  
  -- Project manager can access their own projects
  IF project_manager_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  -- Team members can access projects they're assigned to
  IF project_team_members IS NOT NULL AND user_id_param = ANY(project_team_members) THEN
    RETURN TRUE;
  END IF;
  
  -- Check project_team_members table for additional team memberships
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

-- Create RLS policy for SELECT operations
CREATE POLICY "Users can only view accessible projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (public.can_user_access_project(id, auth.uid()));

-- Create RLS policy for INSERT operations
CREATE POLICY "Users can create projects in their organization" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

-- Create RLS policy for UPDATE operations
CREATE POLICY "Users can update accessible projects" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (public.can_user_access_project(id, auth.uid()));

-- Create RLS policy for DELETE operations
CREATE POLICY "Project managers and admins can delete projects" 
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
