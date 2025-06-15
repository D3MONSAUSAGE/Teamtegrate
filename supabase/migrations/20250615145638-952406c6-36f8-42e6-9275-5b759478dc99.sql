
-- Update the can_user_access_task function to be more restrictive
-- Remove the broad project access that allows seeing all tasks in accessible projects
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
