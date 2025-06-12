
-- Phase 2 - Step 1: Projects Table RLS Policy Cleanup
-- Drop all existing conflicting policies on the projects table

-- Drop all existing policies (33 total found in previous query)
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
DROP POLICY IF EXISTS "Allow project managers to manage projects" ON public.projects;
DROP POLICY IF EXISTS "Managers can manage their projects" ON public.projects;
DROP POLICY IF EXISTS "Team members can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "Project creators can manage their projects" ON public.projects;

-- Create 4 clean, secure policies for the projects table
-- Policy 1: SELECT - Users can view projects from their organization
CREATE POLICY "projects_select_organization" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Policy 2: INSERT - Users can create projects in their organization
CREATE POLICY "projects_insert_organization" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Policy 3: UPDATE - Project managers and admins can update projects in their organization
CREATE POLICY "projects_update_managers_admins" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (
  organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  AND (
    manager_id = auth.uid()::text
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- Policy 4: DELETE - Project managers and admins can delete projects in their organization
CREATE POLICY "projects_delete_managers_admins" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (
  organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  AND (
    manager_id = auth.uid()::text
    OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);
