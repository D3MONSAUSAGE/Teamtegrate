-- Quiz questions RLS for standalone quizzes and ensure quizzes org trigger

-- 1) Ensure RLS is enabled on quiz_questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='quiz_questions'
  ) THEN
    RAISE NOTICE 'Table quiz_questions does not exist, skipping.';
  ELSE
    EXECUTE 'ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 2) Helper: get current user role (already exists in project, but create if missing)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 3) Policies for quiz_questions based on parent quiz organization
-- Drop conflicting existing policies if any (idempotent)
DROP POLICY IF EXISTS "Org users can view quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Managers can insert quiz questions for org quizzes" ON public.quiz_questions;
DROP POLICY IF EXISTS "Managers can update quiz questions for org quizzes" ON public.quiz_questions;

-- SELECT policy: anyone in the org can view questions for quizzes in their org
CREATE POLICY "Org users can view quiz questions"
ON public.quiz_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND q.organization_id = public.get_current_user_organization_id()
  )
);

-- INSERT policy: managers/admins/superadmins can insert questions for quizzes in their org
CREATE POLICY "Managers can insert quiz questions for org quizzes"
ON public.quiz_questions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND q.organization_id = public.get_current_user_organization_id()
  )
  AND (public.get_current_user_role() = ANY (ARRAY['manager'::text,'admin'::text,'superadmin'::text]))
);

-- UPDATE policy: managers/admins/superadmins can update questions for quizzes in their org
CREATE POLICY "Managers can update quiz questions for org quizzes"
ON public.quiz_questions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND q.organization_id = public.get_current_user_organization_id()
  )
  AND (public.get_current_user_role() = ANY (ARRAY['manager'::text,'admin'::text,'superadmin'::text]))
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND q.organization_id = public.get_current_user_organization_id()
  )
  AND (public.get_current_user_role() = ANY (ARRAY['manager'::text,'admin'::text,'superadmin'::text]))
);

-- 4) Ensure quizzes has trigger to auto-set organization_id on insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_quiz_org_before_insert'
  ) THEN
    CREATE TRIGGER set_quiz_org_before_insert
    BEFORE INSERT ON public.quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_quiz_organization();
  END IF;
END $$;