-- Create request assignment rules table
CREATE TABLE public.request_assignment_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_type_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'role_based',
  conditions JSONB NOT NULL DEFAULT '{}',
  assignment_strategy TEXT NOT NULL DEFAULT 'first_available',
  escalation_rules JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request approval workflows table
CREATE TABLE public.request_approval_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_type_id UUID NOT NULL,
  workflow_name TEXT NOT NULL,
  approval_levels JSONB NOT NULL DEFAULT '[]',
  workflow_type TEXT NOT NULL DEFAULT 'sequential',
  timeout_hours INTEGER DEFAULT 48,
  auto_escalate BOOLEAN NOT NULL DEFAULT false,
  delegation_allowed BOOLEAN NOT NULL DEFAULT true,
  emergency_override_roles TEXT[] DEFAULT '{"superadmin","admin"}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request delegations table
CREATE TABLE public.request_delegations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_id UUID NOT NULL,
  original_approver_id UUID NOT NULL,
  delegate_approver_id UUID NOT NULL,
  delegation_reason TEXT,
  delegated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.request_assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_delegations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for request_assignment_rules
CREATE POLICY "Users can view assignment rules in their organization"
ON public.request_assignment_rules
FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage assignment rules"
ON public.request_assignment_rules
FOR ALL
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

-- RLS Policies for request_approval_workflows
CREATE POLICY "Users can view approval workflows in their organization"
ON public.request_approval_workflows
FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage approval workflows"
ON public.request_approval_workflows
FOR ALL
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

-- RLS Policies for request_delegations
CREATE POLICY "Users can view delegations in their organization"
ON public.request_delegations
FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Approvers can create delegations"
ON public.request_delegations
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  original_approver_id = auth.uid()
);

CREATE POLICY "Approvers can update their delegations"
ON public.request_delegations
FOR UPDATE
USING (
  organization_id = get_current_user_organization_id() AND
  original_approver_id = auth.uid()
);

-- Add indexes for performance
CREATE INDEX idx_request_assignment_rules_type ON public.request_assignment_rules(request_type_id);
CREATE INDEX idx_request_assignment_rules_org ON public.request_assignment_rules(organization_id);
CREATE INDEX idx_request_approval_workflows_type ON public.request_approval_workflows(request_type_id);
CREATE INDEX idx_request_approval_workflows_org ON public.request_approval_workflows(organization_id);
CREATE INDEX idx_request_delegations_request ON public.request_delegations(request_id);
CREATE INDEX idx_request_delegations_org ON public.request_delegations(organization_id);

-- Add triggers for updated_at
CREATE TRIGGER update_request_assignment_rules_updated_at
  BEFORE UPDATE ON public.request_assignment_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_request_approval_workflows_updated_at
  BEFORE UPDATE ON public.request_approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();