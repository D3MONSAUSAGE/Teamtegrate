-- Standalone Quizzes Support: add organization_id, trigger, and RLS policies on quizzes
-- 1) Add organization_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.quizzes
      ADD COLUMN organization_id uuid;

    -- Optional index for performance
    CREATE INDEX IF NOT EXISTS idx_quizzes_org ON public.quizzes(organization_id);
  END IF;
END $$;

-- 2) Create or replace trigger function to set organization_id automatically
CREATE OR REPLACE FUNCTION public.set_quiz_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If organization_id wasn't provided, default to current user's org
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.get_current_user_organization_id();
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Attach trigger to quizzes table (insert/update)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_set_quiz_organization'
  ) THEN
    CREATE TRIGGER trg_set_quiz_organization
    BEFORE INSERT OR UPDATE ON public.quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_quiz_organization();
  END IF;
END $$;

-- 4) Enable RLS and add policies to support standalone quizzes (by org)
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Helper: role check expression
-- We embed the role check in each policy to avoid creating a separate function

-- SELECT: anyone in org can see quizzes in their org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'quizzes' AND policyname = 'quizzes_select_by_org'
  ) THEN
    CREATE POLICY "quizzes_select_by_org"
    ON public.quizzes
    FOR SELECT
    USING (organization_id = public.get_current_user_organization_id());
  END IF;
END $$;

-- INSERT: admins/managers can create quizzes in their org (standalone or module-based)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'quizzes' AND policyname = 'quizzes_insert_admins_managers'
  ) THEN
    CREATE POLICY "quizzes_insert_admins_managers"
    ON public.quizzes
    FOR INSERT
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin','superadmin','manager')
      )
    );
  END IF;
END $$;

-- UPDATE: admins/managers can update quizzes in their org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'quizzes' AND policyname = 'quizzes_update_admins_managers'
  ) THEN
    CREATE POLICY "quizzes_update_admins_managers"
    ON public.quizzes
    FOR UPDATE
    USING (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin','superadmin','manager')
      )
    )
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() AND u.role IN ('admin','superadmin','manager')
      )
    );
  END IF;
END $$;
