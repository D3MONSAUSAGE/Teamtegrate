-- Create onboarding document requirements and submissions system (fixed)

-- Document requirement templates
CREATE TABLE IF NOT EXISTS public.onboarding_document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN ('i9', 'w4', 'emergency_contact', 'direct_deposit', 'policy_acknowledgment', 'custom')),
  is_required BOOLEAN NOT NULL DEFAULT true,
  due_days_after_start INTEGER DEFAULT 3,
  instructions TEXT,
  allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'png'],
  max_file_size_mb INTEGER DEFAULT 10,
  requires_approval BOOLEAN DEFAULT true,
  approver_roles TEXT[] DEFAULT ARRAY['manager', 'admin', 'superadmin'],
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Document submissions from employees
CREATE TABLE IF NOT EXISTS public.onboarding_document_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES public.onboarding_instances(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES public.onboarding_document_requirements(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  submission_status TEXT NOT NULL DEFAULT 'pending' CHECK (submission_status IN ('pending', 'under_review', 'approved', 'rejected', 'needs_revision')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  reviewer_notes TEXT,
  rejection_reason TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Approval workflow tracking
CREATE TABLE IF NOT EXISTS public.onboarding_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.onboarding_document_submissions(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL,
  approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Compliance tracking
CREATE TABLE IF NOT EXISTS public.onboarding_compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES public.onboarding_instances(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL CHECK (compliance_type IN ('i9_verification', 'tax_forms', 'emergency_contacts', 'policy_acknowledgments', 'background_check', 'drug_screening')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'not_applicable')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_document_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_compliance_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document requirements
CREATE POLICY "Users can view requirements in their organization" ON public.onboarding_document_requirements
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create requirements" ON public.onboarding_document_requirements
  FOR INSERT WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

CREATE POLICY "Managers can update requirements" ON public.onboarding_document_requirements
  FOR UPDATE USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

-- RLS Policies for document submissions
CREATE POLICY "Users can view submissions in their organization" ON public.onboarding_document_submissions
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Employees can submit their documents" ON public.onboarding_document_submissions
  FOR INSERT WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    employee_id = auth.uid()
  );

CREATE POLICY "Employees can update their submissions" ON public.onboarding_document_submissions
  FOR UPDATE USING (
    organization_id = get_current_user_organization_id() AND
    employee_id = auth.uid()
  );

CREATE POLICY "Managers can review submissions" ON public.onboarding_document_submissions
  FOR UPDATE USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

-- RLS Policies for approvals
CREATE POLICY "Users can view approvals in their organization" ON public.onboarding_approvals
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create approvals" ON public.onboarding_approvals
  FOR INSERT WITH CHECK (
    organization_id = get_current_user_organization_id() AND
    approver_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

-- RLS Policies for compliance items
CREATE POLICY "Users can view compliance items in their organization" ON public.onboarding_compliance_items
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage compliance items" ON public.onboarding_compliance_items
  FOR ALL USING (
    organization_id = get_current_user_organization_id() AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

-- Storage bucket for onboarding documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('onboarding-documents', 'onboarding-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for onboarding documents
CREATE POLICY "Employees can upload their onboarding documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'onboarding-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Employees can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'onboarding-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Managers can view all org documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'onboarding-documents' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
  );

-- Triggers for updated_at timestamps
CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON public.onboarding_document_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.onboarding_document_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_updated_at BEFORE UPDATE ON public.onboarding_compliance_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create compliance items when onboarding instance is created
CREATE OR REPLACE FUNCTION create_default_compliance_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default compliance items for new onboarding instance
    INSERT INTO public.onboarding_compliance_items (
        organization_id, instance_id, compliance_type, due_date
    ) VALUES 
    (NEW.organization_id, NEW.id, 'i9_verification', NEW.start_date + INTERVAL '3 days'),
    (NEW.organization_id, NEW.id, 'tax_forms', NEW.start_date + INTERVAL '5 days'),
    (NEW.organization_id, NEW.id, 'emergency_contacts', NEW.start_date + INTERVAL '2 days'),
    (NEW.organization_id, NEW.id, 'policy_acknowledgments', NEW.start_date + INTERVAL '7 days');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_compliance_items_trigger
  AFTER INSERT ON public.onboarding_instances
  FOR EACH ROW EXECUTE FUNCTION create_default_compliance_items();