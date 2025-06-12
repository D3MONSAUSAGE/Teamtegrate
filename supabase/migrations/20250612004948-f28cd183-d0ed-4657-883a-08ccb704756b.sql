
-- Phase 2 - Step 4 (Revised): Projects Table RLS Policy Cleanup
-- First check and drop the policies that were created in Step 1

-- Drop the policies that were created in our previous migration
DROP POLICY IF EXISTS "projects_select_organization" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_organization" ON public.projects;
DROP POLICY IF EXISTS "projects_update_managers_admins" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_managers_admins" ON public.projects;

-- Also drop any other existing policies that might still be there
DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Org isolation for projects" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.projects;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.projects;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to view projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to update projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to delete projects" ON public.projects;
DROP POLICY IF EXISTS "Projects are viewable by organization members" ON public.projects;
DROP POLICY IF EXISTS "Projects can be created by organization members" ON public.projects;
DROP POLICY IF EXISTS "Projects can be updated by organization members" ON public.projects;
DROP POLICY IF EXISTS "Projects can be deleted by organization members" ON public.projects;
DROP POLICY IF EXISTS "Organization members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Organization members can create projects" ON public.projects;
DROP POLICY IF EXISTS "Organization members can update projects" ON public.projects;
DROP POLICY IF EXISTS "Organization members can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Allow organization access to projects" ON public.projects;
DROP POLICY IF EXISTS "Project managers can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Team members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can manage all projects" ON public.projects;

-- Create 4 clean, secure policies for the projects table with improved UPDATE policy
-- Policy 1: SELECT - Users can view projects from their organization
CREATE POLICY "projects_select_organization_v2" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

-- Policy 2: INSERT - Users can create projects in their organization
CREATE POLICY "projects_insert_organization_v2" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

-- Policy 3: UPDATE - Project managers, team members, and admins can update projects in their organization
CREATE POLICY "projects_update_managers_team_admins_v2" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    manager_id = auth.uid()::text
    OR auth.uid() = ANY(team_members)
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- Policy 4: DELETE - Project managers and admins can delete projects in their organization
CREATE POLICY "projects_delete_managers_admins_v2" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    manager_id = auth.uid()::text
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);
