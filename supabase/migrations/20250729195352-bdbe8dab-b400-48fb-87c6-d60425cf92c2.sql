-- Security Fix: Remove overly permissive project access policies
-- These policies were allowing managers/admins to access ALL projects in organization
-- instead of only projects they're assigned to or manage

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "projects_org_update_fixed" ON public.projects;

-- Drop the overly permissive delete policy  
DROP POLICY IF EXISTS "projects_org_delete_fixed" ON public.projects;

-- Keep only the strict policies that properly use can_user_access_project() function
-- which ensures users can only access projects they're assigned to, manage, or have admin rights for

-- Verify the remaining policies are correct:
-- projects_strict_select_only_accessible should handle SELECT operations
-- projects_strict_insert should handle INSERT operations  
-- projects_strict_update_only_accessible should handle UPDATE operations
-- projects_strict_delete_only_accessible should handle DELETE operations

-- All of these use can_user_access_project() which provides proper access control