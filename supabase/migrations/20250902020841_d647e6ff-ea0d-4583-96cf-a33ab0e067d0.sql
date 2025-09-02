-- Phase 1: Database Enhancement for Onboarding System
-- Create enums
CREATE TYPE public.onboarding_task_category AS ENUM ('hr_documentation', 'compliance_training', 'job_specific_training', 'culture_engagement');
CREATE TYPE public.onboarding_owner_type AS ENUM ('hr', 'manager', 'employee');
CREATE TYPE public.onboarding_instance_status AS ENUM ('active', 'completed', 'on_hold', 'cancelled');
CREATE TYPE public.onboarding_task_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked');
CREATE TYPE public.onboarding_feedback_status AS ENUM ('pending', 'completed');

-- Onboarding templates
CREATE TABLE public.onboarding_templates (
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

-- Onboarding stages/milestones
CREATE TABLE public.onboarding_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  timeframe_label text, -- e.g., "Day 1", "Week 1", "Month 1"
  due_offset_days integer, -- optional relative to onboarding start
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Onboarding tasks (template-level)
CREATE TABLE public.onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.onboarding_stages(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category public.onboarding_task_category NOT NULL,
  owner_type public.onboarding_owner_type NOT NULL,
  resource_links jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{label, url, type}]
  due_offset_days integer, -- optional relative to onboarding start
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Onboarding instances (employee-specific onboarding)
CREATE TABLE public.onboarding_instances (
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

-- Onboarding instance tasks (assigned/trackable tasks per employee)
CREATE TABLE public.onboarding_instance_tasks (
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

-- Feedback checkpoints (30/60/90-day or arbitrary)
CREATE TABLE public.onboarding_feedback_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.onboarding_instances(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  days_offset integer NOT NULL, -- e.g., 30/60/90
  checkpoint_label text, -- e.g., "30-day", "60-day", "90-day"
  status public.onboarding_feedback_status NOT NULL DEFAULT 'pending',
  reviewer_id uuid, -- typically the manager
  completed_at timestamptz,
  notes text,
  rating smallint, -- optional
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_onboarding_templates_org ON public.onboarding_templates(organization_id);
CREATE INDEX idx_onboarding_stages_template ON public.onboarding_stages(template_id);
CREATE INDEX idx_onboarding_tasks_template ON public.onboarding_tasks(template_id);
CREATE INDEX idx_onboarding_instances_org_employee ON public.onboarding_instances(organization_id, employee_id);
CREATE INDEX idx_onboarding_instance_tasks_instance ON public.onboarding_instance_tasks(instance_id);
CREATE INDEX idx_onboarding_feedback_checkpoints_instance ON public.onboarding_feedback_checkpoints(instance_id);

-- Triggers to maintain updated_at
CREATE TRIGGER trg_onboarding_templates_updated
BEFORE UPDATE ON public.onboarding_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_onboarding_stages_updated
BEFORE UPDATE ON public.onboarding_stages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_onboarding_tasks_updated
BEFORE UPDATE ON public.onboarding_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_onboarding_instances_updated
BEFORE UPDATE ON public.onboarding_instances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_onboarding_instance_tasks_updated
BEFORE UPDATE ON public.onboarding_instance_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_onboarding_feedback_checkpoints_updated
BEFORE UPDATE ON public.onboarding_feedback_checkpoints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper trigger functions to set organization_id (and employee_id) from parent records
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

-- Attach the helper triggers
CREATE TRIGGER trg_onboarding_stages_set_org
BEFORE INSERT ON public.onboarding_stages
FOR EACH ROW EXECUTE FUNCTION public.set_onboarding_stage_org();

CREATE TRIGGER trg_onboarding_tasks_set_org
BEFORE INSERT ON public.onboarding_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_onboarding_task_org();

CREATE TRIGGER trg_instance_tasks_set_org_and_employee
BEFORE INSERT ON public.onboarding_instance_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_instance_task_org_and_employee();

CREATE TRIGGER trg_feedback_set_org_and_employee
BEFORE INSERT ON public.onboarding_feedback_checkpoints
FOR EACH ROW EXECUTE FUNCTION public.set_feedback_org_and_employee();

-- Also allow instances to default org from current user if omitted
CREATE TRIGGER trg_onboarding_instances_set_org
BEFORE INSERT ON public.onboarding_instances
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

-- Enable Row Level Security
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_instance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_feedback_checkpoints ENABLE ROW LEVEL SECURITY;

-- Policies for onboarding_templates
CREATE POLICY "Templates are viewable by org"
ON public.onboarding_templates
FOR SELECT
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "Managers can insert templates"
ON public.onboarding_templates
FOR INSERT
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
  AND created_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
);

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

CREATE POLICY "Admins can delete templates"
ON public.onboarding_templates
FOR DELETE
USING (
  organization_id = public.get_current_user_organization_id()
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- Policies for onboarding_stages
CREATE POLICY "Stages selectable by org"
ON public.onboarding_stages
FOR SELECT
USING (organization_id = public.get_current_user_organization_id());

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

-- Policies for onboarding_tasks
CREATE POLICY "Tasks selectable by org"
ON public.onboarding_tasks
FOR SELECT
USING (organization_id = public.get_current_user_organization_id());

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

-- Policies for onboarding_instances
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

CREATE POLICY "Managers create instances"
ON public.onboarding_instances
FOR INSERT
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
  AND created_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
);

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

CREATE POLICY "Admins delete instances"
ON public.onboarding_instances
FOR DELETE
USING (
  organization_id = public.get_current_user_organization_id()
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- Policies for onboarding_instance_tasks
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

CREATE POLICY "Managers insert instance tasks"
ON public.onboarding_instance_tasks
FOR INSERT
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
);

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

CREATE POLICY "Admins delete instance tasks"
ON public.onboarding_instance_tasks
FOR DELETE
USING (
  organization_id = public.get_current_user_organization_id()
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);

-- Policies for feedback checkpoints
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

CREATE POLICY "Managers insert feedback checkpoints"
ON public.onboarding_feedback_checkpoints
FOR INSERT
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager','admin','superadmin'))
);

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

CREATE POLICY "Admins delete feedback"
ON public.onboarding_feedback_checkpoints
FOR DELETE
USING (
  organization_id = public.get_current_user_organization_id()
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','superadmin'))
);
