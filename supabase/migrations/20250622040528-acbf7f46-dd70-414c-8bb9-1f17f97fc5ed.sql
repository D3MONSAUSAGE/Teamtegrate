
-- Phase 1: Database RLS Policy Cleanup
-- Drop all conflicting and overly permissive RLS policies on tasks table

-- Remove the problematic policy that allows broad access
DROP POLICY IF EXISTS "Authenticated users can view tasks they're assigned to or from" ON public.tasks;

-- Remove any other overly permissive policies
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can see all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Tasks are viewable by organization members" ON public.tasks;
DROP POLICY IF EXISTS "Organization members can view tasks" ON public.tasks;

-- Keep only the strict policy that uses can_user_access_task function
-- First drop it to recreate it cleanly
DROP POLICY IF EXISTS "tasks_strict_select_only_assigned_or_created" ON public.tasks;
DROP POLICY IF EXISTS "Users can view authorized tasks" ON public.tasks;

-- Update the can_user_access_task function to be more restrictive for regular users
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
  
  -- Managers can access all tasks in their organization
  IF user_role = 'manager' THEN
    RETURN TRUE;
  END IF;
  
  -- For regular users (role = 'user'), STRICT access control:
  -- They can ONLY see tasks they created OR are directly assigned to
  
  -- Task creator can access their own tasks
  IF task_user_id IS NOT NULL AND task_user_id != '' AND task_user_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  -- Task assignee can access (single assignment)
  IF task_assigned_to_id IS NOT NULL AND task_assigned_to_id != '' AND task_assigned_to_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  -- Task assignee can access (multiple assignment)
  IF task_assigned_to_ids IS NOT NULL AND array_length(task_assigned_to_ids, 1) > 0 THEN
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
  
  -- For regular users, NO other access is allowed
  RETURN FALSE;
END;
$$;

-- Create the clean, strict RLS policy for SELECT
CREATE POLICY "tasks_strict_user_access_only" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (public.can_user_access_task(id, auth.uid()));

-- Ensure other CRUD policies are also strict
DROP POLICY IF EXISTS "Users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update authorized tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete authorized tasks" ON public.tasks;

-- Recreate INSERT policy - users can only insert tasks for themselves or if they're managers/admins
CREATE POLICY "tasks_strict_insert" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid()::text = user_id OR
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager', 'admin', 'superadmin')
);

-- Recreate UPDATE policy - use the same access function
CREATE POLICY "tasks_strict_update" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (public.can_user_access_task(id, auth.uid()));

-- Recreate DELETE policy - only task owners and managers/admins can delete
CREATE POLICY "tasks_strict_delete" 
ON public.tasks 
FOR DELETE 
TO authenticated
USING (
  auth.uid()::text = user_id OR
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager', 'admin', 'superadmin')
);
