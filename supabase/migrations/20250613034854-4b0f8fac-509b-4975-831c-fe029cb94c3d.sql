
-- Fix the get_current_user_organization_id function to properly retrieve organization_id
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

-- Remove conflicting old RLS policy that blocks tasks
DROP POLICY IF EXISTS "Authenticated users can view tasks they're assigned to or from" ON public.tasks;

-- Drop existing organization-based policies to recreate them
DROP POLICY IF EXISTS "org_isolation_tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_tasks_delete" ON public.tasks;

-- Create the correct organization-based RLS policies for tasks
CREATE POLICY "org_isolation_tasks_select" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_tasks_insert" 
ON public.tasks 
FOR INSERT 
TO authenticated
WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_tasks_update" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_tasks_delete" 
ON public.tasks 
FOR DELETE 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());
