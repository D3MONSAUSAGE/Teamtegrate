-- Phase 1: Database Enhancement (idempotent)
-- Ensure enums exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_task_category') THEN
    CREATE TYPE public.onboarding_task_category AS ENUM ('hr_documentation', 'compliance_training', 'job_specific_training', 'culture_engagement');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_owner_type') THEN
    CREATE TYPE public.onboarding_owner_type AS ENUM ('hr', 'manager', 'employee');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_instance_status') THEN
    CREATE TYPE public.onboarding_instance_status AS ENUM ('active', 'completed', 'on_hold', 'cancelled');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_task_status') THEN
    CREATE TYPE public.onboarding_task_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_feedback_status') THEN
    CREATE TYPE public.onboarding_feedback_status AS ENUM ('pending', 'completed');
  END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.onboarding_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  role_id uuid REFERENCES public.job_roles(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  timeframe_label text,
  due_offset_days integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.onboarding_stages(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category public.onboarding_task_category NOT NULL,
  owner_type public.onboarding_owner_type NOT NULL,
  resource_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  due_offset_days integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  template_id uuid REFERENCES public.onboarding_templates(id) ON DELETE SET NULL,
  employee_id uuid NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  status public.onboarding_instance_status NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_instance_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.onboarding_instances(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  template_task_id uuid REFERENCES public.onboarding_tasks(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category public.onboarding_task_category,
  owner_type public.onboarding_owner_type NOT NULL,
  assigned_to_user_id uuid,
  status public.onboarding_task_status NOT NULL DEFAULT 'pending',
  due_date timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  resource_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_feedback_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.onboarding_instances(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  days_offset integer NOT NULL,
  checkpoint_label text,
  status public.onboarding_feedback_status NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  completed_at timestamptz,
  notes text,
  rating smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_templates_org ON public.onboarding_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_stages_template ON public.onboarding_stages(template_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_template ON public.onboarding_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_instances_org_employee ON public.onboarding_instances(organization_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_instance_tasks_instance ON public.onboarding_instance_tasks(instance_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_feedback_checkpoints_instance ON public.onboarding_feedback_checkpoints(instance_id);

-- Triggers for updated_at (create only if missing)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_onboarding_templates_updated') THEN
    CREATE TRIGGER trg_onboarding_templates_updated
    BEFORE UPDATE ON public.onboarding_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_onboarding_stages_updated') THEN
    CREATE TRIGGER trg_onboarding_stages_updated
    BEFORE UPDATE ON public.onboarding_stages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_onboarding_tasks_updated') THEN
    CREATE TRIGGER trg_onboarding_tasks_updated
    BEFORE UPDATE ON public.onboarding_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_onboarding_instances_updated') THEN
    CREATE TRIGGER trg_onboarding_instances_updated
    BEFORE UPDATE ON public.onboarding_instances
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_onboarding_instance_tasks_updated') THEN
    CREATE TRIGGER trg_onboarding_instance_tasks_updated
    BEFORE UPDATE ON public.onboarding_instance_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_onboarding_feedback_checkpoints_updated') THEN
    CREATE TRIGGER trg_onboarding_feedback_checkpoints_updated
    BEFORE UPDATE ON public.onboarding_feedback_checkpoints
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Helper trigger functions
CREATE OR REPLACE FUNCTION public.set_onboarding_stage_org()
RETURNS trigger AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.onboarding_templates WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_onboarding_task_org()
RETURNS trigger AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.onboarding_templates WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_instance_task_org_and_employee()
RETURNS trigger AS $$
BEGIN
  IF NEW.organization_id IS NULL OR NEW.employee_id IS NULL THEN
    SELECT organization_id, employee_id INTO NEW.organization_id, NEW.employee_id
    FROM public.onboarding_instances WHERE id = NEW.instance_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_feedback_org_and_employee()
RETURNS trigger AS $$
BEGIN
  IF NEW.organization_id IS NULL OR NEW.employee_id IS NULL THEN
    SELECT organization_id, employee_id INTO NEW.organization_id, NEW.employee_id
    FROM public.onboarding_instances WHERE id = NEW.instance_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach helper triggers if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_onboarding_stages_set_org') THEN
    CREATE TRIGGER trg_onboarding_stages_set_org
    BEFORE INSERT ON public.onboarding_stages
    FOR EACH ROW EXECUTE FUNCTION public.set_onboarding_stage_org();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_onboarding_tasks_set_org') THEN
    CREATE TRIGGER trg_onboarding_tasks_set_org
    BEFORE INSERT ON public.onboarding_tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_onboarding_task_org();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_instance_tasks_set_org_and_employee') THEN
    CREATE TRIGGER trg_instance_tasks_set_org_and_employee
    BEFORE INSERT ON public.onboarding_instance_tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_instance_task_org_and_employee();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_feedback_set_org_and_employee') THEN
    CREATE TRIGGER trg_feedback_set_org_and_employee
    BEFORE INSERT ON public.onboarding_feedback_checkpoints
    FOR EACH ROW EXECUTE FUNCTION public.set_feedback_org_and_employee();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_onboarding_instances_set_org') THEN
    CREATE TRIGGER trg_onboarding_instances_set_org
    BEFORE INSERT ON public.onboarding_instances
    FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_instance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_feedback_checkpoints ENABLE ROW LEVEL SECURITY;

-- Policies (create if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_templates' AND policyname='Templates are viewable by org'
  ) THEN
    CREATE POLICY "Templates are viewable by org"
    ON public.onboarding_templates
    FOR SELECT
    USING (organization_id = public.get_current_user_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_templates' AND policyname='Managers can insert templates'
  ) THEN
    CREATE POLICY "Managers can insert templates"
    ON public.onboarding_templates
    FOR INSERT
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND created_by = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_templates' AND policyname='Managers can update templates'
  ) THEN
    CREATE POLICY "Managers can update templates"
    ON public.onboarding_templates
    FOR UPDATE
    USING (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
    )
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_templates' AND policyname='Admins can delete templates'
  ) THEN
    CREATE POLICY "Admins can delete templates"
    ON public.onboarding_templates
    FOR DELETE
    USING (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
    );
  END IF;
END $$;

-- onboarding_stages policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_stages' AND policyname='Stages selectable by org'
  ) THEN
    CREATE POLICY "Stages selectable by org"
    ON public.onboarding_stages
    FOR SELECT
    USING (organization_id = public.get_current_user_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_stages' AND policyname='Managers manage stages'
  ) THEN
    CREATE POLICY "Managers manage stages"
    ON public.onboarding_stages
    FOR ALL
    USING (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
    )
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
    );
  END IF;
END $$;

-- onboarding_tasks policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_tasks' AND policyname='Tasks selectable by org'
  ) THEN
    CREATE POLICY "Tasks selectable by org"
    ON public.onboarding_tasks
    FOR SELECT
    USING (organization_id = public.get_current_user_organization_id());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_tasks' AND policyname='Managers manage tasks'
  ) THEN
    CREATE POLICY "Managers manage tasks"
    ON public.onboarding_tasks
    FOR ALL
    USING (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
    )
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
    );
  END IF;
END $$;

-- onboarding_instances policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_instances' AND policyname='Instances selectable by org and permitted users'
  ) THEN
    CREATE POLICY "Instances selectable by org and permitted users"
    ON public.onboarding_instances
    FOR SELECT
    USING (
      organization_id = public.get_current_user_organization_id()
      AND (
        employee_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
        OR created_by = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_instances' AND policyname='Managers create instances'
  ) THEN
    CREATE POLICY "Managers create instances"
    ON public.onboarding_instances
    FOR INSERT
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND created_by = auth.uid()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_instances' AND policyname='Managers update instances'
  ) THEN
    CREATE POLICY "Managers update instances"
    ON public.onboarding_instances
    FOR UPDATE
    USING (
      organization_id = public.get_current_user_organization_id()
      AND (
        created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
      )
    )
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND (
        created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_instances' AND policyname='Admins delete instances'
  ) THEN
    CREATE POLICY "Admins delete instances"
    ON public.onboarding_instances
    FOR DELETE
    USING (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
    );
  END IF;
END $$;

-- onboarding_instance_tasks policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_instance_tasks' AND policyname='Instance tasks are selectable by permitted users in org'
  ) THEN
    CREATE POLICY "Instance tasks are selectable by permitted users in org"
    ON public.onboarding_instance_tasks
    FOR SELECT
    USING (
      organization_id = public.get_current_user_organization_id()
      AND (
        employee_id = auth.uid()
        OR assigned_to_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_instance_tasks' AND policyname='Managers insert instance tasks'
  ) THEN
    CREATE POLICY "Managers insert instance tasks"
    ON public.onboarding_instance_tasks
    FOR INSERT
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_instance_tasks' AND policyname='Assignees, employee, or managers update instance tasks'
  ) THEN
    CREATE POLICY "Assignees, employee, or managers update instance tasks"
    ON public.onboarding_instance_tasks
    FOR UPDATE
    USING (
      organization_id = public.get_current_user_organization_id()
      AND (
        employee_id = auth.uid()
        OR assigned_to_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
      )
    )
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND (
        employee_id = auth.uid()
        OR assigned_to_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_instance_tasks' AND policyname='Admins delete instance tasks'
  ) THEN
    CREATE POLICY "Admins delete instance tasks"
    ON public.onboarding_instance_tasks
    FOR DELETE
    USING (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
    );
  END IF;
END $$;

-- onboarding_feedback_checkpoints policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_feedback_checkpoints' AND policyname='Feedback selectable by permitted users in org'
  ) THEN
    CREATE POLICY "Feedback selectable by permitted users in org"
    ON public.onboarding_feedback_checkpoints
    FOR SELECT
    USING (
      organization_id = public.get_current_user_organization_id()
      AND (
        employee_id = auth.uid()
        OR reviewer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_feedback_checkpoints' AND policyname='Managers insert feedback checkpoints'
  ) THEN
    CREATE POLICY "Managers insert feedback checkpoints"
    ON public.onboarding_feedback_checkpoints
    FOR INSERT
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_feedback_checkpoints' AND policyname='Reviewer or managers update feedback'
  ) THEN
    CREATE POLICY "Reviewer or managers update feedback"
    ON public.onboarding_feedback_checkpoints
    FOR UPDATE
    USING (
      organization_id = public.get_current_user_organization_id()
      AND (
        reviewer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
      )
    )
    WITH CHECK (
      organization_id = public.get_current_user_organization_id()
      AND (
        reviewer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_feedback_checkpoints' AND policyname='Admins delete feedback'
  ) THEN
    CREATE POLICY "Admins delete feedback"
    ON public.onboarding_feedback_checkpoints
    FOR DELETE
    USING (
      organization_id = public.get_current_user_organization_id()
      AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
    );
  END IF;
END $$;