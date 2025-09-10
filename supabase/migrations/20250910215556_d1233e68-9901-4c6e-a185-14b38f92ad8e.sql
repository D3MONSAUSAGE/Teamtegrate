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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_current_user_role' AND pronamespace = 'public'::regnamespace
  ) THEN
    CREATE OR REPLACE FUNCTION public.get_current_user_role()
    RETURNS text
    LANGUAGE sql
    STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
      SELECT role FROM public.users WHERE id = auth.uid();
    $$;
  END IF;
END $$;

-- 3) Policies for quiz_questions based on parent quiz organization
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='quiz_questions') THEN

    -- Drop conflicting existing policies if any (idempotent)
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='quiz_questions' AND policyname='Org users can view quiz questions';
    IF FOUND THEN
      EXECUTE 'DROP POLICY "Org users can view quiz questions" ON public.quiz_questions';
    END IF;

    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='quiz_questions' AND policyname='Managers can insert quiz questions for org quizzes';
    IF FOUND THEN
      EXECUTE 'DROP POLICY "Managers can insert quiz questions for org quizzes" ON public.quiz_questions';
    END IF;

    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='quiz_questions' AND policyname='Managers can update quiz questions for org quizzes';
    IF FOUND THEN
      EXECUTE 'DROP POLICY "Managers can update quiz questions for org quizzes" ON public.quiz_questions';
    END IF;

    -- SELECT policy: anyone in the org can view questions for quizzes in their org
    EXECUTE $$
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
    $$;

    -- INSERT policy: managers/admins/superadmins can insert questions for quizzes in their org
    EXECUTE $$
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
        AND (public.get_current_user_role() = ANY (ARRAY['manager','admin','superadmin']))
      );
    $$;

    -- UPDATE policy: managers/admins/superadmins can update questions for quizzes in their org
    EXECUTE $$
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
        AND (public.get_current_user_role() = ANY (ARRAY['manager','admin','superadmin']))
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.quizzes q
          WHERE q.id = quiz_questions.quiz_id
            AND q.organization_id = public.get_current_user_organization_id()
        )
        AND (public.get_current_user_role() = ANY (ARRAY['manager','admin','superadmin']))
      );
    $$;
  END IF;
END $$;

-- 4) Ensure quizzes has trigger to auto-set organization_id on insert
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quizzes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'set_quiz_org_before_insert'
    ) THEN
      EXECUTE $$
        CREATE TRIGGER set_quiz_org_before_insert
        BEFORE INSERT ON public.quizzes
        FOR EACH ROW
        EXECUTE FUNCTION public.set_quiz_organization();
      $$;
    END IF;
  END IF;
END $$;