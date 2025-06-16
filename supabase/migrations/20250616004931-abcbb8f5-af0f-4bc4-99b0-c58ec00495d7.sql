
-- Fix the can_user_access_task function to properly handle multiple assignees
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
  IF task_user_id IS NOT NULL AND task_user_id != '' AND task_user_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  -- Task assignee can access (single assignment) - Check for empty strings
  IF task_assigned_to_id IS NOT NULL AND task_assigned_to_id != '' AND task_assigned_to_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  -- Task assignee can access (multiple assignment) - IMPROVED: Better array handling
  IF task_assigned_to_ids IS NOT NULL AND array_length(task_assigned_to_ids, 1) > 0 THEN
    -- Check if user_id is in the array, filtering out empty strings and nulls
    IF EXISTS (
      SELECT 1 
      FROM unnest(task_assigned_to_ids) AS assigned_id 
      WHERE assigned_id IS NOT NULL 
        AND assigned_id != '' 
        AND assigned_id = user_id_param::text
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Test the function to make sure it works correctly
-- (This will help us debug if there are still issues)
SELECT 'RLS function updated successfully' as status;
