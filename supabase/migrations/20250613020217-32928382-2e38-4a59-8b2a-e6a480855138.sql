
-- Enable RLS on tasks table if not already enabled
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Add SELECT policy for tasks - allows users to view tasks from their organization
CREATE POLICY "tasks_org_select" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
);

-- Add INSERT policy for tasks - allows users to create tasks in their organization
CREATE POLICY "tasks_org_insert" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
);

-- Add UPDATE policy for tasks - allows task creators, assignees, and admins to update
CREATE POLICY "tasks_org_update" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()::text
    OR assigned_to_id = auth.uid()::text
    OR auth.uid()::text = ANY(assigned_to_ids)
    OR public.get_current_user_role() IN ('admin', 'superadmin')
  )
);

-- Add DELETE policy for tasks - allows task creators and admins to delete
CREATE POLICY "tasks_org_delete" 
ON public.tasks 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    user_id = auth.uid()::text
    OR public.get_current_user_role() IN ('admin', 'superadmin')
  )
);
