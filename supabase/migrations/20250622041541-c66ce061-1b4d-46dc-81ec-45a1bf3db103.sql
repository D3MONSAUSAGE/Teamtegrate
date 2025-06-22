
-- Clean up the problematic RLS policy that's causing users to see tasks they shouldn't
DROP POLICY IF EXISTS "Authenticated users can view tasks they're assigned to or from" ON public.tasks;

-- Also drop any other similar overly permissive policies that might still exist
DROP POLICY IF EXISTS "Users can view tasks they're assigned to or from" ON public.tasks;
DROP POLICY IF EXISTS "Tasks are viewable by assigned users or creators" ON public.tasks;
DROP POLICY IF EXISTS "Allow task access to assigned users and creators" ON public.tasks;

-- Verify our strict policy is in place (this should already exist from the previous migration)
-- If it doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname = 'tasks_strict_user_access_only'
  ) THEN
    CREATE POLICY "tasks_strict_user_access_only" 
    ON public.tasks 
    FOR SELECT 
    TO authenticated
    USING (public.can_user_access_task(id, auth.uid()));
  END IF;
END $$;

-- List remaining policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks' 
ORDER BY policyname;
