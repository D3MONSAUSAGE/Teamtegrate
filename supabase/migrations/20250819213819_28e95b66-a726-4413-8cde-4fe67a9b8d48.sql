-- Add missing WITH CHECK policies for INSERT operations

-- schedule_templates insert policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schedule_templates' AND policyname = 'Managers can insert schedule templates'
  ) THEN
    CREATE POLICY "Managers can insert schedule templates"
    ON public.schedule_templates FOR INSERT
    WITH CHECK (
      organization_id = get_current_user_organization_id() 
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
      )
    );
  END IF;
END $$;

-- shift_templates insert policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shift_templates' AND policyname = 'Managers can insert shift templates'
  ) THEN
    CREATE POLICY "Managers can insert shift templates"
    ON public.shift_templates FOR INSERT
    WITH CHECK (
      organization_id = get_current_user_organization_id() 
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
      )
    );
  END IF;
END $$;

-- employee_schedules insert policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_schedules' AND policyname = 'Managers can insert employee schedules'
  ) THEN
    CREATE POLICY "Managers can insert employee schedules"
    ON public.employee_schedules FOR INSERT
    WITH CHECK (
      organization_id = get_current_user_organization_id() 
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
      )
    );
  END IF;
END $$;

-- schedule_periods insert policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'schedule_periods' AND policyname = 'Managers can insert schedule periods'
  ) THEN
    CREATE POLICY "Managers can insert schedule periods"
    ON public.schedule_periods FOR INSERT
    WITH CHECK (
      organization_id = get_current_user_organization_id() 
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
      )
    );
  END IF;
END $$;

-- employee_availability insert policies (employees and managers)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_availability' AND policyname = 'Employees can insert their availability'
  ) THEN
    CREATE POLICY "Employees can insert their availability"
    ON public.employee_availability FOR INSERT
    WITH CHECK (
      organization_id = get_current_user_organization_id() 
      AND employee_id = auth.uid()
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_availability' AND policyname = 'Managers can insert availability for anyone'
  ) THEN
    CREATE POLICY "Managers can insert availability for anyone"
    ON public.employee_availability FOR INSERT
    WITH CHECK (
      organization_id = get_current_user_organization_id() 
      AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
      )
    );
  END IF;
END $$;