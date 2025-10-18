-- Create employee_document_templates table
CREATE TABLE IF NOT EXISTS public.employee_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create template_document_requirements table
CREATE TABLE IF NOT EXISTS public.template_document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.employee_document_templates(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  requires_expiry BOOLEAN NOT NULL DEFAULT false,
  default_validity_days INTEGER,
  instructions TEXT,
  allowed_file_types TEXT[] NOT NULL DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png']::TEXT[],
  max_file_size_mb NUMERIC NOT NULL DEFAULT 10,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create employee_document_assignments table
CREATE TABLE IF NOT EXISTS public.employee_document_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.employee_document_templates(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_org ON public.employee_document_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_requirements_template ON public.template_document_requirements(template_id);
CREATE INDEX IF NOT EXISTS idx_assignments_org ON public.employee_document_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_assignments_template ON public.employee_document_assignments(template_id);

-- Add trigger for updated_at
CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON public.employee_document_templates
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.employee_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_document_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_document_templates
CREATE POLICY "Users can view templates in their org"
  ON public.employee_document_templates 
  FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create templates"
  ON public.employee_document_templates 
  FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() 
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Managers can update templates"
  ON public.employee_document_templates 
  FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Managers can delete templates"
  ON public.employee_document_templates 
  FOR DELETE
  USING (
    organization_id = get_current_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- RLS Policies for template_document_requirements
CREATE POLICY "Users can view requirements in their org"
  ON public.template_document_requirements 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_document_templates 
      WHERE id = template_document_requirements.template_id 
      AND organization_id = get_current_user_organization_id()
    )
  );

CREATE POLICY "Managers can manage requirements"
  ON public.template_document_requirements 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_document_templates t
      JOIN public.users u ON u.id = auth.uid()
      WHERE t.id = template_document_requirements.template_id 
      AND t.organization_id = get_current_user_organization_id()
      AND u.role IN ('manager', 'admin', 'superadmin')
    )
  );

-- RLS Policies for employee_document_assignments
CREATE POLICY "Users can view assignments in their org"
  ON public.employee_document_assignments 
  FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create assignments"
  ON public.employee_document_assignments 
  FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id()
    AND assigned_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Managers can delete assignments"
  ON public.employee_document_assignments 
  FOR DELETE
  USING (
    organization_id = get_current_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );