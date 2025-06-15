
-- Fix UUID Empty String Error - Update RLS Function and Clean Database
-- This migration addresses the "invalid input syntax for type uuid" error

-- Step 1: Update can_user_access_task function to handle empty strings properly
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
  
  -- Task assignee can access (single assignment) - FIXED: Check for empty strings
  IF task_assigned_to_id IS NOT NULL AND task_assigned_to_id != '' AND task_assigned_to_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  -- Task assignee can access (multiple assignment) - FIXED: Check for NULL and filter empty strings
  IF task_assigned_to_ids IS NOT NULL AND array_length(task_assigned_to_ids, 1) > 0 THEN
    -- Filter out any empty strings from the array before checking
    IF user_id_param::text = ANY(
      SELECT unnest(task_assigned_to_ids) 
      WHERE unnest(task_assigned_to_ids) IS NOT NULL 
      AND unnest(task_assigned_to_ids) != ''
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Step 2: Clean up existing data - Convert empty strings to NULL in assigned_to_id
UPDATE public.tasks 
SET assigned_to_id = NULL 
WHERE assigned_to_id = '' OR assigned_to_id = ' ';

-- Step 3: Clean up existing data - Remove empty strings from assigned_to_ids arrays
UPDATE public.tasks 
SET assigned_to_ids = array_remove(assigned_to_ids, '')
WHERE assigned_to_ids IS NOT NULL 
AND '' = ANY(assigned_to_ids);

-- Step 4: Clean up existing data - Remove null strings from assigned_to_ids arrays
UPDATE public.tasks 
SET assigned_to_ids = array_remove(assigned_to_ids, null)
WHERE assigned_to_ids IS NOT NULL;

-- Step 5: Set assigned_to_ids to NULL if it becomes empty after cleanup
UPDATE public.tasks 
SET assigned_to_ids = NULL 
WHERE assigned_to_ids IS NOT NULL 
AND array_length(assigned_to_ids, 1) IS NULL;

-- Step 6: Clean up assigned_to_names array to match assigned_to_ids
UPDATE public.tasks 
SET assigned_to_names = NULL 
WHERE assigned_to_ids IS NULL;

-- Step 7: Add check constraints to prevent empty strings in UUID fields (future prevention)
ALTER TABLE public.tasks 
ADD CONSTRAINT check_assigned_to_id_not_empty 
CHECK (assigned_to_id IS NULL OR assigned_to_id != '');

-- Step 8: Add function to validate assigned_to_ids array (no empty strings)
CREATE OR REPLACE FUNCTION public.validate_assigned_to_ids(ids TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Return false if array contains empty strings or nulls
  IF ids IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check for empty strings in array
  IF '' = ANY(ids) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Step 9: Add check constraint for assigned_to_ids array
ALTER TABLE public.tasks 
ADD CONSTRAINT check_assigned_to_ids_no_empty 
CHECK (public.validate_assigned_to_ids(assigned_to_ids));

-- Step 10: Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_id_not_null ON public.tasks(assigned_to_id) WHERE assigned_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_ids_not_null ON public.tasks USING GIN(assigned_to_ids) WHERE assigned_to_ids IS NOT NULL;

-- Log completion
SELECT 'UUID empty string fix migration completed successfully' as status;
