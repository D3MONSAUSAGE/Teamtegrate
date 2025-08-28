-- Ensure proper INSERT/UPDATE policies with WITH CHECK for training tables

-- training_courses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_courses' AND policyname='Admins can insert courses' 
  ) THEN
    CREATE POLICY "Admins can insert courses"
    ON public.training_courses
    FOR INSERT
    WITH CHECK (
      organization_id = get_current_user_organization_id() AND 
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_courses' AND policyname='Admins can update courses'
  ) THEN
    CREATE POLICY "Admins can update courses"
    ON public.training_courses
    FOR UPDATE
    USING (
      organization_id = get_current_user_organization_id() AND 
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    )
    WITH CHECK (
      organization_id = get_current_user_organization_id() AND 
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    );
  END IF;
END $$;

-- training_modules
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_modules' AND policyname='Admins can insert modules'
  ) THEN
    CREATE POLICY "Admins can insert modules"
    ON public.training_modules
    FOR INSERT
    WITH CHECK (
      course_id IN (
        SELECT id FROM training_courses WHERE organization_id = get_current_user_organization_id()
      ) AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_modules' AND policyname='Admins can update modules'
  ) THEN
    CREATE POLICY "Admins can update modules"
    ON public.training_modules
    FOR UPDATE
    USING (
      course_id IN (
        SELECT id FROM training_courses WHERE organization_id = get_current_user_organization_id()
      ) AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    )
    WITH CHECK (
      course_id IN (
        SELECT id FROM training_courses WHERE organization_id = get_current_user_organization_id()
      ) AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    );
  END IF;
END $$;

-- quizzes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quizzes' AND policyname='Admins can insert quizzes'
  ) THEN
    CREATE POLICY "Admins can insert quizzes"
    ON public.quizzes
    FOR INSERT
    WITH CHECK (
      module_id IN (
        SELECT tm.id FROM training_modules tm JOIN training_courses tc ON tm.course_id = tc.id
        WHERE tc.organization_id = get_current_user_organization_id()
      ) AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quizzes' AND policyname='Admins can update quizzes'
  ) THEN
    CREATE POLICY "Admins can update quizzes"
    ON public.quizzes
    FOR UPDATE
    USING (
      module_id IN (
        SELECT tm.id FROM training_modules tm JOIN training_courses tc ON tm.course_id = tc.id
        WHERE tc.organization_id = get_current_user_organization_id()
      ) AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    )
    WITH CHECK (
      module_id IN (
        SELECT tm.id FROM training_modules tm JOIN training_courses tc ON tm.course_id = tc.id
        WHERE tc.organization_id = get_current_user_organization_id()
      ) AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    );
  END IF;
END $$;

-- quiz_questions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quiz_questions' AND policyname='Admins can insert questions'
  ) THEN
    CREATE POLICY "Admins can insert questions"
    ON public.quiz_questions
    FOR INSERT
    WITH CHECK (
      quiz_id IN (
        SELECT q.id FROM quizzes q
        JOIN training_modules tm ON q.module_id = tm.id
        JOIN training_courses tc ON tm.course_id = tc.id
        WHERE tc.organization_id = get_current_user_organization_id()
      ) AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quiz_questions' AND policyname='Admins can update questions'
  ) THEN
    CREATE POLICY "Admins can update questions"
    ON public.quiz_questions
    FOR UPDATE
    USING (
      quiz_id IN (
        SELECT q.id FROM quizzes q
        JOIN training_modules tm ON q.module_id = tm.id
        JOIN training_courses tc ON tm.course_id = tc.id
        WHERE tc.organization_id = get_current_user_organization_id()
      ) AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    )
    WITH CHECK (
      quiz_id IN (
        SELECT q.id FROM quizzes q
        JOIN training_modules tm ON q.module_id = tm.id
        JOIN training_courses tc ON tm.course_id = tc.id
        WHERE tc.organization_id = get_current_user_organization_id()
      ) AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin','manager'))
    );
  END IF;
END $$;