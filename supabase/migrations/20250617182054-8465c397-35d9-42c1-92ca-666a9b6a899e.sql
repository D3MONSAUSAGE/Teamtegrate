
-- Remove the problematic RLS policy that allows broad project-based task access
DROP POLICY IF EXISTS "Authenticated users can view tasks they're assigned to or from" ON public.tasks;

-- Also remove any other overly permissive policies that might exist
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can see all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Tasks are viewable by organization members" ON public.tasks;
DROP POLICY IF EXISTS "Organization members can view tasks" ON public.tasks;

-- Drop the existing strict policy first, then recreate it to ensure it's properly configured
DROP POLICY IF EXISTS "tasks_strict_select_only_assigned_or_created" ON public.tasks;

-- Recreate the correct strict policy
-- This policy uses the can_user_access_task function which properly restricts access
CREATE POLICY "tasks_strict_select_only_assigned_or_created" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (public.can_user_access_task(id, auth.uid()));
