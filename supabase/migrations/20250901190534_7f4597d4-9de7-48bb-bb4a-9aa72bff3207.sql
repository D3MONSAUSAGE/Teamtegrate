-- Create compliance training templates table
CREATE TABLE public.compliance_training_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  jurisdiction TEXT NOT NULL, -- e.g., 'CA', 'NY', 'TX', 'Federal'
  external_base_url TEXT NOT NULL,
  url_parameters JSONB DEFAULT '{}',
  language_options TEXT[] DEFAULT ARRAY['English'],
  role_classifications TEXT[] DEFAULT ARRAY['Employee', 'Supervisor'],
  completion_method TEXT NOT NULL DEFAULT 'external_certificate',
  is_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add external training fields to training_courses table
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS external_base_url TEXT;
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS url_parameters JSONB DEFAULT '{}';
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS completion_method TEXT DEFAULT 'internal';
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS compliance_template_id UUID;

-- Create compliance training records table
CREATE TABLE public.compliance_training_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  template_id UUID NOT NULL,
  course_id UUID,
  language_selected TEXT NOT NULL,
  role_classification TEXT NOT NULL,
  external_training_url TEXT,
  completion_date TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  is_completed BOOLEAN DEFAULT false,
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.compliance_training_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_training_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for compliance_training_templates
CREATE POLICY "Users can view templates in their organization"
ON public.compliance_training_templates
FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Admins can manage templates"
ON public.compliance_training_templates
FOR ALL
USING ((organization_id = get_current_user_organization_id()) AND (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')
)));

-- RLS policies for compliance_training_records
CREATE POLICY "Users can view their own compliance records"
ON public.compliance_training_records
FOR SELECT
USING ((organization_id = get_current_user_organization_id()) AND (user_id = auth.uid()));

CREATE POLICY "Admins can view all compliance records in organization"
ON public.compliance_training_records
FOR SELECT
USING ((organization_id = get_current_user_organization_id()) AND (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')
)));

CREATE POLICY "Users can create their own compliance records"
ON public.compliance_training_records
FOR INSERT
WITH CHECK ((organization_id = get_current_user_organization_id()) AND (user_id = auth.uid()));

CREATE POLICY "Users can update their own compliance records"
ON public.compliance_training_records
FOR UPDATE
USING ((organization_id = get_current_user_organization_id()) AND (user_id = auth.uid()));

CREATE POLICY "Admins can manage compliance records"
ON public.compliance_training_records
FOR ALL
USING ((organization_id = get_current_user_organization_id()) AND (EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')
)));

-- Update triggers for timestamps
CREATE TRIGGER update_compliance_training_templates_updated_at
BEFORE UPDATE ON public.compliance_training_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_training_records_updated_at
BEFORE UPDATE ON public.compliance_training_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();