
-- Phase 2 - Step 3: Users Table RLS Policy Cleanup
-- Drop all existing conflicting policies on the users table

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view users in their organization" ON public.users;
DROP POLICY IF EXISTS "Users can insert users in their organization" ON public.users;
DROP POLICY IF EXISTS "Users can update users in their organization" ON public.users;
DROP POLICY IF EXISTS "Users can delete users in their organization" ON public.users;
DROP POLICY IF EXISTS "Org isolation for users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can create profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to view users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to delete users" ON public.users;
DROP POLICY IF EXISTS "Users are viewable by organization members" ON public.users;
DROP POLICY IF EXISTS "Users can be created by organization members" ON public.users;
DROP POLICY IF EXISTS "Users can be updated by organization members" ON public.users;
DROP POLICY IF EXISTS "Users can be deleted by organization members" ON public.users;
DROP POLICY IF EXISTS "Organization members can view users" ON public.users;
DROP POLICY IF EXISTS "Organization members can create users" ON public.users;
DROP POLICY IF EXISTS "Organization members can update users" ON public.users;
DROP POLICY IF EXISTS "Organization members can delete users" ON public.users;
DROP POLICY IF EXISTS "Allow organization access to users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can view organization members" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.users;
DROP POLICY IF EXISTS "Superadmins can delete users" ON public.users;

-- Create 4 clean, secure policies for the users table
-- Policy 1: SELECT - Users can view other users in their organization
CREATE POLICY "users_select_organization" 
ON public.users 
FOR SELECT 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

-- Policy 2: INSERT - Only system can insert users (handled by triggers during signup)
CREATE POLICY "users_insert_system_only" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (false); -- Block manual inserts, only allow via triggers

-- Policy 3: UPDATE - Users can update their own profile, admins can update any user in their org
CREATE POLICY "users_update_self_and_admins" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    id = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- Policy 4: DELETE - Only superadmins can delete users in their organization
CREATE POLICY "users_delete_superadmins_only" 
ON public.users 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'superadmin'
);
