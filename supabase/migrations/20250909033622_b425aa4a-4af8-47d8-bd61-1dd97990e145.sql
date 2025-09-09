-- Add job role integration to request types
ALTER TABLE public.request_types 
ADD COLUMN default_job_roles uuid[] DEFAULT '{}',
ADD COLUMN expertise_tags text[] DEFAULT '{}',
ADD COLUMN geographic_scope text DEFAULT 'any',
ADD COLUMN workload_balancing_enabled boolean DEFAULT true;

-- Add workload tracking view for approvers
CREATE OR REPLACE VIEW public.approver_workloads AS
SELECT 
  ra.approver_id,
  COUNT(*) as active_requests,
  AVG(EXTRACT(EPOCH FROM (NOW() - ra.created_at))/3600) as avg_pending_hours,
  COUNT(*) FILTER (WHERE ra.status = 'pending') as pending_count
FROM public.request_approvals ra
WHERE ra.status IN ('pending', 'approved')
  AND ra.created_at > NOW() - INTERVAL '30 days'
GROUP BY ra.approver_id;

-- Add expertise and location to user profiles (extend users table)
ALTER TABLE public.users 
ADD COLUMN expertise_tags text[] DEFAULT '{}',
ADD COLUMN location text,
ADD COLUMN workload_preference text DEFAULT 'normal';

-- Create assignment performance tracking table
CREATE TABLE public.request_assignment_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  request_id uuid NOT NULL,
  approver_id uuid NOT NULL,
  assignment_rule_id uuid,
  job_role_id uuid,
  assignment_time timestamp with time zone NOT NULL DEFAULT now(),
  response_time_hours numeric,
  assignment_score integer, -- 1-100 rating how good the assignment was
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE public.request_assignment_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignment analytics
CREATE POLICY "Users can view assignment analytics in their organization"
ON public.request_assignment_analytics
FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can insert assignment analytics"
ON public.request_assignment_analytics
FOR INSERT
WITH CHECK (organization_id = get_current_user_organization_id());

-- Add job role assignment rule templates
CREATE TABLE public.assignment_rule_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL, -- 'it', 'hr', 'finance', 'general'
  rule_config jsonb NOT NULL,
  is_global boolean DEFAULT false,
  organization_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignment_rule_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates
CREATE POLICY "Users can view templates in their organization or global ones"
ON public.assignment_rule_templates
FOR SELECT
USING (is_global = true OR organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create templates in their organization"
ON public.assignment_rule_templates
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

-- Add some default templates
INSERT INTO public.assignment_rule_templates (name, description, category, rule_config, is_global) VALUES
(
  'IT Equipment Requests',
  'Route IT equipment requests to users with IT job roles',
  'it',
  '{
    "conditions": [
      {"field": "request_category", "operator": "equals", "value": "it_access"}
    ],
    "assignment_strategy": "job_role_based",
    "job_role_filter": {"has_job_role": true},
    "escalation_rules": {"timeout_hours": 24, "escalate_to": "manager"}
  }',
  true
),
(
  'HR Administration',
  'Route HR requests to HR job roles',
  'hr',
  '{
    "conditions": [
      {"field": "request_category", "operator": "equals", "value": "hr_admin"}
    ],
    "assignment_strategy": "job_role_based",
    "job_role_filter": {"has_job_role": true},
    "workload_balancing": true
  }',
  true
),
(
  'Financial Requests',
  'Route financial requests with expertise matching',
  'finance',
  '{
    "conditions": [
      {"field": "request_category", "operator": "equals", "value": "financial"}
    ],
    "assignment_strategy": "expertise_based",
    "expertise_required": ["finance", "accounting"],
    "geographic_preference": true
  }',
  true
);