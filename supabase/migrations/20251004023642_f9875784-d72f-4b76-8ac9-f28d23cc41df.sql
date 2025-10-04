-- Fix RLS circular dependency on users table
-- This allows get_current_user_organization_id() to read user data without triggering recursion

CREATE POLICY "Allow self-read for organization lookup"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());