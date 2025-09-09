-- Create request type templates table for marketplace
CREATE TABLE public.request_type_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  popularity_score INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  template_data JSONB NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tags TEXT[] DEFAULT '{}',
  version TEXT DEFAULT '1.0.0'
);

-- Create request analytics table for detailed tracking
CREATE TABLE public.request_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_id UUID NOT NULL,
  request_type_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'created', 'submitted', 'approved', 'rejected', 'completed'
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  processing_time_minutes INTEGER,
  approver_id UUID,
  previous_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request automation rules table
CREATE TABLE public.request_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  request_type_id UUID,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 10,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request templates usage tracking
CREATE TABLE public.request_template_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  template_id UUID NOT NULL,
  user_id UUID NOT NULL,
  request_id UUID,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add columns to requests table for enhanced tracking
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS template_used_id UUID,
ADD COLUMN IF NOT EXISTS estimated_processing_time INTEGER,
ADD COLUMN IF NOT EXISTS actual_processing_time INTEGER,
ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automation_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automation_rule_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attachments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.request_type_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_template_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for request_type_templates
CREATE POLICY "Users can view templates in their organization or public templates"
ON public.request_type_templates
FOR SELECT
USING (is_public = true OR organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create templates"
ON public.request_type_templates
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
);

CREATE POLICY "Managers can update templates"
ON public.request_type_templates
FOR UPDATE
USING (
  organization_id = get_current_user_organization_id()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
);

-- RLS policies for request_analytics
CREATE POLICY "Users can view analytics in their organization"
ON public.request_analytics
FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can insert analytics"
ON public.request_analytics
FOR INSERT
WITH CHECK (organization_id = get_current_user_organization_id());

-- RLS policies for request_automation_rules
CREATE POLICY "Managers can manage automation rules"
ON public.request_automation_rules
FOR ALL
USING (
  organization_id = get_current_user_organization_id()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
);

-- RLS policies for request_template_usage
CREATE POLICY "Users can track template usage in their organization"
ON public.request_template_usage
FOR ALL
USING (organization_id = get_current_user_organization_id())
WITH CHECK (organization_id = get_current_user_organization_id());

-- Create indexes for performance
CREATE INDEX idx_request_analytics_org_type ON public.request_analytics(organization_id, request_type_id);
CREATE INDEX idx_request_analytics_timestamp ON public.request_analytics(event_timestamp);
CREATE INDEX idx_request_templates_category ON public.request_type_templates(category, is_public);
CREATE INDEX idx_request_templates_popularity ON public.request_type_templates(popularity_score DESC);

-- Insert default request type templates
INSERT INTO public.request_type_templates (
  name, description, category, icon, is_public, is_featured, template_data, created_by, tags
) VALUES 
(
  'IT Equipment Request',
  'Request new IT equipment like laptops, monitors, or software licenses',
  'it_access',
  'Laptop',
  true,
  true,
  '{
    "form_schema": [
      {"field": "equipment_type", "type": "select", "label": "Equipment Type", "required": true, "options": ["Laptop", "Desktop", "Monitor", "Software License", "Mobile Device", "Accessories"]},
      {"field": "business_justification", "type": "textarea", "label": "Business Justification", "required": true, "placeholder": "Explain why this equipment is needed"},
      {"field": "preferred_specifications", "type": "textarea", "label": "Preferred Specifications", "required": false, "placeholder": "Any specific requirements or preferences"},
      {"field": "urgency_level", "type": "select", "label": "Urgency", "required": true, "options": ["Standard (2-3 weeks)", "Expedited (1 week)", "Emergency (2-3 days)"]},
      {"field": "budget_code", "type": "text", "label": "Budget/Cost Center Code", "required": false}
    ],
    "requires_approval": true,
    "approval_roles": ["manager", "admin"],
    "estimated_processing_days": 7,
    "default_priority": "medium"
  }',
  '00000000-0000-0000-0000-000000000000',
  ARRAY['it', 'equipment', 'hardware', 'software']
),
(
  'Time Off Request',
  'Request vacation, sick leave, or other time off',
  'time_schedule',
  'Calendar',
  true,
  true,
  '{
    "form_schema": [
      {"field": "leave_type", "type": "select", "label": "Type of Leave", "required": true, "options": ["Vacation", "Sick Leave", "Personal Day", "Bereavement", "Maternity/Paternity", "Unpaid Leave"]},
      {"field": "start_date", "type": "date", "label": "Start Date", "required": true},
      {"field": "end_date", "type": "date", "label": "End Date", "required": true},
      {"field": "total_days", "type": "number", "label": "Total Days", "required": true, "min": 0.5},
      {"field": "reason", "type": "textarea", "label": "Reason (if applicable)", "required": false},
      {"field": "coverage_arrangements", "type": "textarea", "label": "Work Coverage Arrangements", "required": true, "placeholder": "Describe how your work will be covered"}
    ],
    "requires_approval": true,
    "approval_roles": ["manager"],
    "estimated_processing_days": 2,
    "default_priority": "medium"
  }',
  '00000000-0000-0000-0000-000000000000',
  ARRAY['time-off', 'vacation', 'leave', 'hr']
),
(
  'Training Request',
  'Request approval for training courses, conferences, or certifications',
  'training',
  'GraduationCap',
  true,
  true,
  '{
    "form_schema": [
      {"field": "training_title", "type": "text", "label": "Training/Course Title", "required": true},
      {"field": "training_provider", "type": "text", "label": "Training Provider", "required": true},
      {"field": "training_type", "type": "select", "label": "Training Type", "required": true, "options": ["Online Course", "In-Person Workshop", "Conference", "Certification Exam", "Degree Program"]},
      {"field": "start_date", "type": "date", "label": "Start Date", "required": true},
      {"field": "duration", "type": "text", "label": "Duration", "required": true, "placeholder": "e.g., 2 days, 40 hours, 6 months"},
      {"field": "cost", "type": "number", "label": "Total Cost", "required": true, "min": 0},
      {"field": "business_relevance", "type": "textarea", "label": "Business Relevance", "required": true, "placeholder": "How will this training benefit your role and the organization?"},
      {"field": "expected_outcomes", "type": "textarea", "label": "Expected Learning Outcomes", "required": true}
    ],
    "requires_approval": true,
    "approval_roles": ["manager", "admin"],
    "estimated_processing_days": 5,
    "default_priority": "low"
  }',
  '00000000-0000-0000-0000-000000000000',
  ARRAY['training', 'education', 'certification', 'development']
);

-- Create function to track request analytics
CREATE OR REPLACE FUNCTION public.track_request_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Track status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.request_analytics (
      organization_id,
      request_id,
      request_type_id,
      event_type,
      user_id,
      previous_status,
      new_status,
      processing_time_minutes,
      metadata
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      NEW.request_type_id,
      'status_change',
      auth.uid(),
      OLD.status,
      NEW.status,
      CASE 
        WHEN NEW.status = 'completed' AND OLD.submitted_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (NOW() - OLD.submitted_at))/60
        ELSE NULL
      END,
      jsonb_build_object(
        'old_priority', OLD.priority,
        'new_priority', NEW.priority,
        'processing_user', auth.uid()
      )
    );
  END IF;
  
  -- Track new requests
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.request_analytics (
      organization_id,
      request_id,
      request_type_id,
      event_type,
      user_id,
      new_status,
      metadata
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      NEW.request_type_id,
      'created',
      NEW.requested_by,
      NEW.status,
      jsonb_build_object(
        'priority', NEW.priority,
        'template_used', NEW.template_used_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for request analytics
CREATE TRIGGER request_analytics_trigger
  AFTER INSERT OR UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.track_request_analytics();

-- Create function to update template popularity
CREATE OR REPLACE FUNCTION public.update_template_popularity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_used_id IS NOT NULL THEN
    UPDATE public.request_type_templates 
    SET usage_count = usage_count + 1,
        popularity_score = popularity_score + 1
    WHERE id = NEW.template_used_id;
    
    INSERT INTO public.request_template_usage (
      organization_id,
      template_id,
      user_id,
      request_id
    ) VALUES (
      NEW.organization_id,
      NEW.template_used_id,
      NEW.requested_by,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for template usage tracking
CREATE TRIGGER template_usage_trigger
  AFTER INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_template_popularity();