-- Fix RLS Policy Conflict for quiz_answer_overrides
-- Drop the conflicting old policy that prevents updates by different users
DROP POLICY IF EXISTS "Admins can manage overrides in their organization" ON public.quiz_answer_overrides;

-- Update the UPDATE policy to remove the problematic with_check constraint
-- that was preventing different admins from editing each other's overrides
DROP POLICY IF EXISTS "org admins can update overrides" ON public.quiz_answer_overrides;

-- Recreate the UPDATE policy without the restrictive with_check
CREATE POLICY "org admins can update overrides" ON public.quiz_answer_overrides
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.organization_id = quiz_answer_overrides.organization_id 
    AND u.role = ANY(ARRAY['admin', 'superadmin', 'manager'])
  )
);

-- Ensure INSERT policy allows admins to create overrides
DROP POLICY IF EXISTS "org admins can insert overrides" ON public.quiz_answer_overrides;

CREATE POLICY "org admins can insert overrides" ON public.quiz_answer_overrides
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.organization_id = quiz_answer_overrides.organization_id 
    AND u.role = ANY(ARRAY['admin', 'superadmin', 'manager'])
  )
  AND overridden_by = auth.uid()
);