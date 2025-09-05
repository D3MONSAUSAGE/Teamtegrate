-- Create request types table
CREATE TABLE public.request_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  form_schema JSONB DEFAULT '[]'::jsonb,
  requires_approval BOOLEAN DEFAULT true,
  approval_roles TEXT[] DEFAULT ARRAY['manager', 'admin', 'superadmin'],
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create requests table
CREATE TABLE public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_type_id UUID NOT NULL REFERENCES public.request_types(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  form_data JSONB DEFAULT '{}'::jsonb,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request attachments table
CREATE TABLE public.request_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request approvals table
CREATE TABLE public.request_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL,
  approval_level INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request comments table
CREATE TABLE public.request_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.request_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for request_types
CREATE POLICY "Users can view request types in their organization" 
ON public.request_types FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create request types" 
ON public.request_types FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

CREATE POLICY "Managers can update request types" 
ON public.request_types FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id()
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

-- Create RLS policies for requests
CREATE POLICY "Users can view their own requests or requests they can approve" 
ON public.requests FOR SELECT 
USING (
  organization_id = get_current_user_organization_id()
  AND (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  )
);

CREATE POLICY "Users can create their own requests" 
ON public.requests FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND requested_by = auth.uid()
);

CREATE POLICY "Users can update their own requests or approvers can update" 
ON public.requests FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id()
  AND (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  )
);

-- Create RLS policies for request_attachments
CREATE POLICY "Users can view attachments for requests they can see" 
ON public.request_attachments FOR SELECT 
USING (
  organization_id = get_current_user_organization_id()
  AND EXISTS (
    SELECT 1 FROM public.requests r 
    WHERE r.id = request_id 
    AND (
      r.requested_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
      )
    )
  )
);

CREATE POLICY "Users can add attachments to their own requests" 
ON public.request_attachments FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.requests r 
    WHERE r.id = request_id 
    AND r.requested_by = auth.uid()
  )
);

-- Create RLS policies for request_approvals
CREATE POLICY "Users can view approvals for requests they can see" 
ON public.request_approvals FOR SELECT 
USING (
  organization_id = get_current_user_organization_id()
  AND EXISTS (
    SELECT 1 FROM public.requests r 
    WHERE r.id = request_id 
    AND (
      r.requested_by = auth.uid()
      OR approver_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
      )
    )
  )
);

CREATE POLICY "Approvers can create and update approvals" 
ON public.request_approvals FOR ALL 
USING (
  organization_id = get_current_user_organization_id()
  AND (
    approver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND (
    approver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  )
);

-- Create RLS policies for request_comments
CREATE POLICY "Users can view comments for requests they can see" 
ON public.request_comments FOR SELECT 
USING (
  organization_id = get_current_user_organization_id()
  AND EXISTS (
    SELECT 1 FROM public.requests r 
    WHERE r.id = request_id 
    AND (
      r.requested_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
      )
    )
  )
);

CREATE POLICY "Users can add comments to requests they can see" 
ON public.request_comments FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.requests r 
    WHERE r.id = request_id 
    AND (
      r.requested_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'superadmin')
      )
    )
  )
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_request_types_updated_at
  BEFORE UPDATE ON public.request_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_request_comments_updated_at
  BEFORE UPDATE ON public.request_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default request types
INSERT INTO public.request_types (organization_id, name, description, category, form_schema, created_by) VALUES
('00000000-0000-0000-0000-000000000000', 'Time Off Request', 'Request time off from work', 'time_schedule', '[
  {"field": "start_date", "type": "date", "label": "Start Date", "required": true},
  {"field": "end_date", "type": "date", "label": "End Date", "required": true},
  {"field": "reason", "type": "select", "label": "Reason", "options": ["Vacation", "Sick Leave", "Personal", "Emergency"], "required": true},
  {"field": "coverage", "type": "text", "label": "Coverage Arrangements", "required": false}
]'::jsonb, '00000000-0000-0000-0000-000000000000'),

('00000000-0000-0000-0000-000000000000', 'Schedule Change Request', 'Request changes to work schedule', 'time_schedule', '[
  {"field": "current_schedule", "type": "text", "label": "Current Schedule", "required": true},
  {"field": "requested_schedule", "type": "text", "label": "Requested Schedule", "required": true},
  {"field": "reason", "type": "textarea", "label": "Reason for Change", "required": true},
  {"field": "effective_date", "type": "date", "label": "Effective Date", "required": true}
]'::jsonb, '00000000-0000-0000-0000-000000000000'),

('00000000-0000-0000-0000-000000000000', 'Equipment Request', 'Request equipment or supplies', 'hr_admin', '[
  {"field": "equipment_type", "type": "select", "label": "Equipment Type", "options": ["Computer/Laptop", "Monitor", "Software", "Office Supplies", "Other"], "required": true},
  {"field": "description", "type": "textarea", "label": "Description", "required": true},
  {"field": "justification", "type": "textarea", "label": "Business Justification", "required": true},
  {"field": "estimated_cost", "type": "number", "label": "Estimated Cost", "required": false}
]'::jsonb, '00000000-0000-0000-0000-000000000000'),

('00000000-0000-0000-0000-000000000000', 'Training Request', 'Request training or professional development', 'training', '[
  {"field": "training_type", "type": "select", "label": "Training Type", "options": ["Course", "Conference", "Certification", "Workshop", "Online Learning"], "required": true},
  {"field": "provider", "type": "text", "label": "Training Provider", "required": true},
  {"field": "cost", "type": "number", "label": "Cost", "required": true},
  {"field": "duration", "type": "text", "label": "Duration", "required": true},
  {"field": "business_case", "type": "textarea", "label": "Business Case", "required": true}
]'::jsonb, '00000000-0000-0000-0000-000000000000');