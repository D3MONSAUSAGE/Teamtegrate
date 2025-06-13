
-- Clean up conflicting RLS policies on tasks table
-- Remove all old/conflicting policies that are interfering with organization-based access

-- Drop old global policies
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can view tasks they're assigned to or from" ON public.tasks;
DROP POLICY IF EXISTS "Task owners and project managers can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task owners and project managers can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can see all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their tasks" ON public.tasks;

-- Drop duplicate organization policy
DROP POLICY IF EXISTS "clean_tasks_org_2025" ON public.tasks;

-- Drop any other conflicting policies that might exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.tasks;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.tasks;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.tasks;
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their organization" ON public.tasks;

-- Verify that only our clean organization-based policies remain:
-- org_isolation_tasks_select
-- org_isolation_tasks_insert  
-- org_isolation_tasks_update
-- org_isolation_tasks_delete

-- List remaining policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks' 
ORDER BY policyname;
