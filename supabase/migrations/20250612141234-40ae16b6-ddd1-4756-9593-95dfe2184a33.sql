
-- Emergency RLS Policy Cleanup - Remove ALL conflicting policies on users table
-- Step 1: Remove all existing conflicting policies that weren't properly cleaned up

DROP POLICY IF EXISTS "org_isolation_users_select" ON public.users;
DROP POLICY IF EXISTS "org_isolation_users_insert" ON public.users;
DROP POLICY IF EXISTS "org_isolation_users_update" ON public.users;
DROP POLICY IF EXISTS "org_isolation_users_delete" ON public.users;
DROP POLICY IF EXISTS "clean_users_org_2025" ON public.users;
DROP POLICY IF EXISTS "final_users_org_access" ON public.users;
DROP POLICY IF EXISTS "users_select_organization" ON public.users;
DROP POLICY IF EXISTS "users_insert_system_only" ON public.users;
DROP POLICY IF EXISTS "users_update_self_and_admins" ON public.users;
DROP POLICY IF EXISTS "users_delete_superadmins_only" ON public.users;
DROP POLICY IF EXISTS "users_can_view_own_and_org" ON public.users;
DROP POLICY IF EXISTS "users_update_own_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_superadmin_only" ON public.users;

-- Step 2: Create ONE SIMPLE policy that allows organization access
-- This replaces ALL the conflicting policies with a single, clean policy

CREATE POLICY "users_organization_access_final" ON public.users
FOR ALL USING (
  -- Users can access their own record OR users in their organization
  id = auth.uid() 
  OR 
  (auth.uid() IS NOT NULL AND organization_id = public.get_current_user_organization_id())
);

-- Step 3: Ensure get_current_user_organization_id handles null gracefully
-- Update the function to be more robust with null auth.uid()
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- Step 4: Verify the cleanup worked
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN left(qual, 50) || '...'
    ELSE 'No condition'
  END as condition_preview
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;
