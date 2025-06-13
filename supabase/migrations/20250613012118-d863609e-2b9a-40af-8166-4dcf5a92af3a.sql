
-- Create a security definer function to safely get the current user's role
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Add UPDATE policy for projects - allows project managers, team members, and admins to update
CREATE POLICY "projects_org_update" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    manager_id = auth.uid()::text
    OR auth.uid() = ANY(team_members)
    OR public.get_current_user_role() IN ('admin', 'superadmin')
  )
);

-- Add DELETE policy for projects - allows project managers and admins to delete
CREATE POLICY "projects_org_delete" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    manager_id = auth.uid()::text
    OR public.get_current_user_role() IN ('admin', 'superadmin')
  )
);
