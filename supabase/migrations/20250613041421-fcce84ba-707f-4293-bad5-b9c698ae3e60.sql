
-- Step 1: Remove the conflicting legacy RLS policy that's blocking access
-- This policy is too restrictive and conflicts with organization-based isolation
DROP POLICY IF EXISTS "Authenticated users can view tasks they're assigned to or from" ON public.tasks;

-- Verify that the get_current_user_organization_id() function is working properly
-- Let's also ensure it handles edge cases correctly
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_auth_uid UUID;
  found_org_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_auth_uid := auth.uid();
  
  -- If auth.uid() is null, return null immediately
  IF current_auth_uid IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the organization_id for the authenticated user
  SELECT organization_id INTO found_org_id 
  FROM public.users 
  WHERE id = current_auth_uid;
  
  RETURN found_org_id;
END;
$$;

-- Verify the organization-based policies are correctly set up
-- These should be the only policies on the tasks table after removing the legacy one
-- org_isolation_tasks_select
-- org_isolation_tasks_insert  
-- org_isolation_tasks_update
-- org_isolation_tasks_delete

-- List current policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks' 
ORDER BY policyname;
