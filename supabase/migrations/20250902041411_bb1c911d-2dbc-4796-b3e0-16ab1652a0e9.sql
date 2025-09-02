-- Create onboarding steps table for sequential steps within stages
CREATE TABLE public.onboarding_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL,
  stage_id UUID,
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  step_type TEXT NOT NULL, -- 'document', 'course', 'quiz', 'video', 'task', 'meeting', 'approval'
  order_index INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  estimated_duration_minutes INTEGER,
  due_offset_days INTEGER,
  prerequisites JSONB DEFAULT '[]'::jsonb, -- Array of step IDs that must be completed first
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onboarding step content table for rich content
CREATE TABLE public.onboarding_step_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'text', 'video', 'document', 'external_link'
  content_data JSONB NOT NULL, -- Store URLs, text content, document paths, etc.
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onboarding step requirements table for course/quiz links
CREATE TABLE public.onboarding_step_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  requirement_type TEXT NOT NULL, -- 'course', 'quiz', 'document_upload', 'approval'
  requirement_id UUID, -- ID of course, quiz, etc.
  requirement_data JSONB, -- Additional configuration
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onboarding instance step progress table
CREATE TABLE public.onboarding_instance_step_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL,
  step_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked', -- 'locked', 'available', 'in_progress', 'completed', 'skipped'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_data JSONB, -- Store completion evidence, scores, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instance_id, step_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_step_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_step_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_instance_step_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for onboarding_steps
CREATE POLICY "Users can view steps in their organization" 
ON public.onboarding_steps FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create steps" 
ON public.onboarding_steps FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

CREATE POLICY "Managers can update steps" 
ON public.onboarding_steps FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

-- Create RLS policies for onboarding_step_content
CREATE POLICY "Users can view step content in their organization" 
ON public.onboarding_step_content FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create step content" 
ON public.onboarding_step_content FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

CREATE POLICY "Managers can update step content" 
ON public.onboarding_step_content FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

-- Create RLS policies for onboarding_step_requirements
CREATE POLICY "Users can view step requirements in their organization" 
ON public.onboarding_step_requirements FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create step requirements" 
ON public.onboarding_step_requirements FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

CREATE POLICY "Managers can update step requirements" 
ON public.onboarding_step_requirements FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

-- Create RLS policies for onboarding_instance_step_progress
CREATE POLICY "Users can view step progress in their organization" 
ON public.onboarding_instance_step_progress FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Employees can update their own step progress" 
ON public.onboarding_instance_step_progress FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  employee_id = auth.uid()
) WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  employee_id = auth.uid()
);

CREATE POLICY "System can create step progress" 
ON public.onboarding_instance_step_progress FOR INSERT 
WITH CHECK (organization_id = get_current_user_organization_id());

-- Create indexes for performance
CREATE INDEX idx_onboarding_steps_template_id ON public.onboarding_steps(template_id);
CREATE INDEX idx_onboarding_steps_stage_id ON public.onboarding_steps(stage_id);
CREATE INDEX idx_onboarding_steps_org_order ON public.onboarding_steps(organization_id, order_index);

CREATE INDEX idx_onboarding_step_content_step_id ON public.onboarding_step_content(step_id);
CREATE INDEX idx_onboarding_step_content_org ON public.onboarding_step_content(organization_id);

CREATE INDEX idx_onboarding_step_requirements_step_id ON public.onboarding_step_requirements(step_id);
CREATE INDEX idx_onboarding_step_requirements_org ON public.onboarding_step_requirements(organization_id);

CREATE INDEX idx_onboarding_instance_step_progress_instance ON public.onboarding_instance_step_progress(instance_id);
CREATE INDEX idx_onboarding_instance_step_progress_employee ON public.onboarding_instance_step_progress(employee_id);
CREATE INDEX idx_onboarding_instance_step_progress_org ON public.onboarding_instance_step_progress(organization_id);

-- Create triggers for updated_at
CREATE TRIGGER update_onboarding_steps_updated_at
BEFORE UPDATE ON public.onboarding_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_step_content_updated_at
BEFORE UPDATE ON public.onboarding_step_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_step_requirements_updated_at
BEFORE UPDATE ON public.onboarding_step_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_instance_step_progress_updated_at
BEFORE UPDATE ON public.onboarding_instance_step_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();