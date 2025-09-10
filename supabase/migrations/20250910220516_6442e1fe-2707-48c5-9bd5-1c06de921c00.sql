-- Add DELETE RLS policy for standalone quizzes
CREATE POLICY "quizzes_delete_admins_managers" 
ON public.quizzes 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() 
  AND (
    SELECT role FROM public.users WHERE id = auth.uid()
  ) = ANY(ARRAY['admin', 'superadmin', 'manager'])
);

-- Ensure quiz_questions DELETE policy exists
CREATE POLICY "quiz_questions_delete_when_quiz_owned" 
ON public.quiz_questions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q 
    WHERE q.id = quiz_questions.quiz_id 
    AND q.organization_id = get_current_user_organization_id()
    AND (
      SELECT role FROM public.users WHERE id = auth.uid()
    ) = ANY(ARRAY['admin', 'superadmin', 'manager'])
  )
);