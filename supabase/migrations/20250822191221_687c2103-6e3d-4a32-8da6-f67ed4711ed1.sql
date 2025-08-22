-- Create missing functions for chat room access control
CREATE OR REPLACE FUNCTION public.would_leave_org_without_superadmin(target_user_id uuid, org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  superadmin_count INTEGER;
  target_user_role TEXT;
BEGIN
  -- Get the target user's role
  SELECT role INTO target_user_role
  FROM public.users 
  WHERE id = target_user_id AND organization_id = org_id;
  
  -- If target user is not a superadmin, their removal won't affect superadmin count
  IF target_user_role != 'superadmin' THEN
    RETURN false;
  END IF;
  
  -- Count active superadmins in the organization (excluding the target user)
  SELECT COUNT(*) INTO superadmin_count
  FROM public.users 
  WHERE organization_id = org_id 
    AND role = 'superadmin'
    AND id != target_user_id;
  
  -- Return true if removing this user would leave no superadmins
  RETURN superadmin_count = 0;
END;
$function$;

-- Improve chat room creation by adding auto-participant functionality
CREATE OR REPLACE FUNCTION public.can_user_access_task(task_id text, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_org_id uuid;
  task_org_id uuid;
  user_role text;
BEGIN
  -- Get user's organization and role
  SELECT organization_id, role INTO user_org_id, user_role
  FROM public.users 
  WHERE id = user_id;
  
  -- Get task's organization
  SELECT organization_id INTO task_org_id
  FROM public.tasks 
  WHERE id = task_id;
  
  -- Users must be in same organization
  IF user_org_id != task_org_id THEN
    RETURN false;
  END IF;
  
  -- Admins and superadmins can access all tasks in their org
  IF user_role IN ('admin', 'superadmin') THEN
    RETURN true;
  END IF;
  
  -- Check if user is assigned to, created, or managing the task
  RETURN EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id 
    AND (
      t.user_id = user_id::text OR 
      t.assigned_to_id = user_id::text OR 
      user_id::text = ANY(t.assigned_to_ids) OR
      EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = t.project_id 
        AND p.manager_id = user_id::text
      )
    )
  );
END;
$function$;

-- Create helper functions for project access
CREATE OR REPLACE FUNCTION public.user_is_project_creator(project_id text, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND manager_id = user_id::text
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_is_project_member(project_id text, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.project_team_members 
    WHERE project_id = user_is_project_member.project_id AND user_id = user_is_project_member.user_id
  );
$function$;