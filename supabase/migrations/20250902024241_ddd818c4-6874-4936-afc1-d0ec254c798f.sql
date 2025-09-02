-- Create onboarding resources table
CREATE TABLE public.onboarding_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('document', 'video', 'link', 'image', 'template')),
  category TEXT NOT NULL CHECK (category IN ('hr_documentation', 'compliance_training', 'job_specific_training', 'culture_engagement', 'general')),
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  external_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_resources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view resources in their organization" 
ON public.onboarding_resources 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create resources" 
ON public.onboarding_resources 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
  AND EXISTS(
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

CREATE POLICY "Managers can update resources" 
ON public.onboarding_resources 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND (
    created_by = auth.uid() 
    OR EXISTS(
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  )
);

CREATE POLICY "Managers can delete resources" 
ON public.onboarding_resources 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() 
  AND (
    created_by = auth.uid() 
    OR EXISTS(
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_onboarding_resources_updated_at
BEFORE UPDATE ON public.onboarding_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create junction table for task-resource relationships
CREATE TABLE public.onboarding_task_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  resource_id UUID NOT NULL,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, resource_id)
);

-- Enable RLS for junction table
ALTER TABLE public.onboarding_task_resources ENABLE ROW LEVEL SECURITY;

-- Junction table policies
CREATE POLICY "Users can view task resources in their organization" 
ON public.onboarding_task_resources 
FOR SELECT 
USING (
  EXISTS(
    SELECT 1 FROM public.onboarding_resources r
    WHERE r.id = resource_id 
    AND r.organization_id = get_current_user_organization_id()
  )
);

CREATE POLICY "Managers can manage task resources" 
ON public.onboarding_task_resources 
FOR ALL 
USING (
  EXISTS(
    SELECT 1 FROM public.onboarding_resources r
    WHERE r.id = resource_id 
    AND r.organization_id = get_current_user_organization_id()
    AND EXISTS(
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  )
)
WITH CHECK (
  EXISTS(
    SELECT 1 FROM public.onboarding_resources r
    WHERE r.id = resource_id 
    AND r.organization_id = get_current_user_organization_id()
    AND EXISTS(
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  )
);