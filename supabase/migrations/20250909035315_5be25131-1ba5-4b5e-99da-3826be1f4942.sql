-- Phase 6: Enterprise Integration & Advanced Automation Database Setup

-- Real-time collaboration tables
CREATE TABLE public.request_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_id UUID NOT NULL,
  user_id UUID NOT NULL,
  parent_comment_id UUID NULL,
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.request_activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_id UUID NOT NULL,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Advanced workflow automation tables
CREATE TABLE public.workflow_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  workflow_id UUID NOT NULL,
  condition_type TEXT NOT NULL,
  field_path TEXT NOT NULL,
  operator TEXT NOT NULL,
  value_data JSONB NOT NULL,
  logic_operator TEXT DEFAULT 'AND',
  condition_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.workflow_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  workflow_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  execution_order INTEGER NOT NULL DEFAULT 0,
  retry_config JSONB DEFAULT '{"max_retries": 3, "retry_delay_ms": 1000}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  workflow_id UUID NOT NULL,
  request_id UUID NOT NULL,
  trigger_event TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  execution_data JSONB DEFAULT '{}',
  error_details JSONB NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced analytics tables
CREATE TABLE public.request_cost_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_id UUID NOT NULL,
  cost_category TEXT NOT NULL,
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  actual_cost DECIMAL(10,2) DEFAULT 0,
  cost_currency TEXT DEFAULT 'USD',
  cost_center TEXT NULL,
  budget_code TEXT NULL,
  tracking_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.analytics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  snapshot_type TEXT NOT NULL,
  time_period TEXT NOT NULL,
  metrics_data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Webhook system tables
CREATE TABLE public.webhook_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  headers JSONB DEFAULT '{}',
  retry_config JSONB DEFAULT '{"max_retries": 3, "retry_delay_ms": 1000}',
  is_active BOOLEAN DEFAULT true,
  last_success_at TIMESTAMP WITH TIME ZONE NULL,
  last_failure_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  endpoint_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER NULL,
  response_body TEXT NULL,
  retry_count INTEGER DEFAULT 0,
  delivered_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Digital signatures and compliance
CREATE TABLE public.digital_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  request_id UUID NOT NULL,
  signer_id UUID NOT NULL,
  signature_data JSONB NOT NULL,
  signature_method TEXT NOT NULL DEFAULT 'digital',
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.compliance_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID NOT NULL,
  changes JSONB NOT NULL DEFAULT '{}',
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  session_id TEXT NULL,
  compliance_flags TEXT[] DEFAULT '{}',
  retention_until TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for request_comments
CREATE POLICY "Users can view comments in their organization"
ON public.request_comments FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create comments in their organization"
ON public.request_comments FOR INSERT
WITH CHECK (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
ON public.request_comments FOR UPDATE
USING (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
ON public.request_comments FOR DELETE
USING (organization_id = get_current_user_organization_id() AND user_id = auth.uid());

-- RLS Policies for request_activity_feed
CREATE POLICY "Users can view activity in their organization"
ON public.request_activity_feed FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can create activity records"
ON public.request_activity_feed FOR INSERT
WITH CHECK (organization_id = get_current_user_organization_id());

-- RLS Policies for workflow_conditions
CREATE POLICY "Admins can manage workflow conditions"
ON public.workflow_conditions FOR ALL
USING (organization_id = get_current_user_organization_id() AND 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')));

CREATE POLICY "Users can view workflow conditions in their organization"
ON public.workflow_conditions FOR SELECT
USING (organization_id = get_current_user_organization_id());

-- RLS Policies for workflow_actions
CREATE POLICY "Admins can manage workflow actions"
ON public.workflow_actions FOR ALL
USING (organization_id = get_current_user_organization_id() AND 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')));

CREATE POLICY "Users can view workflow actions in their organization"
ON public.workflow_actions FOR SELECT
USING (organization_id = get_current_user_organization_id());

-- RLS Policies for workflow_executions
CREATE POLICY "Users can view workflow executions in their organization"
ON public.workflow_executions FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can create workflow executions"
ON public.workflow_executions FOR INSERT
WITH CHECK (organization_id = get_current_user_organization_id());

CREATE POLICY "System can update workflow executions"
ON public.workflow_executions FOR UPDATE
USING (organization_id = get_current_user_organization_id());

-- RLS Policies for request_cost_tracking
CREATE POLICY "Users can view cost tracking in their organization"
ON public.request_cost_tracking FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage cost tracking"
ON public.request_cost_tracking FOR ALL
USING (organization_id = get_current_user_organization_id() AND 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')));

-- RLS Policies for analytics_snapshots
CREATE POLICY "Users can view analytics in their organization"
ON public.analytics_snapshots FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can create analytics snapshots"
ON public.analytics_snapshots FOR INSERT
WITH CHECK (organization_id = get_current_user_organization_id());

-- RLS Policies for webhook_endpoints
CREATE POLICY "Admins can manage webhook endpoints"
ON public.webhook_endpoints FOR ALL
USING (organization_id = get_current_user_organization_id() AND 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

-- RLS Policies for webhook_deliveries
CREATE POLICY "Admins can view webhook deliveries"
ON public.webhook_deliveries FOR SELECT
USING (organization_id = get_current_user_organization_id() AND 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "System can create webhook deliveries"
ON public.webhook_deliveries FOR INSERT
WITH CHECK (organization_id = get_current_user_organization_id());

-- RLS Policies for digital_signatures
CREATE POLICY "Users can view signatures in their organization"
ON public.digital_signatures FOR SELECT
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create their own signatures"
ON public.digital_signatures FOR INSERT
WITH CHECK (organization_id = get_current_user_organization_id() AND signer_id = auth.uid());

-- RLS Policies for compliance_audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.compliance_audit_logs FOR SELECT
USING (organization_id = get_current_user_organization_id() AND 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')));

CREATE POLICY "System can create audit logs"
ON public.compliance_audit_logs FOR INSERT
WITH CHECK (organization_id = get_current_user_organization_id());

-- Create indexes for performance
CREATE INDEX idx_request_comments_request_id ON public.request_comments(request_id);
CREATE INDEX idx_request_comments_user_id ON public.request_comments(user_id);
CREATE INDEX idx_request_comments_mentions ON public.request_comments USING GIN(mentions);
CREATE INDEX idx_request_activity_feed_request_id ON public.request_activity_feed(request_id);
CREATE INDEX idx_request_activity_feed_user_id ON public.request_activity_feed(user_id);
CREATE INDEX idx_workflow_conditions_workflow_id ON public.workflow_conditions(workflow_id);
CREATE INDEX idx_workflow_actions_workflow_id ON public.workflow_actions(workflow_id);
CREATE INDEX idx_workflow_executions_request_id ON public.workflow_executions(request_id);
CREATE INDEX idx_request_cost_tracking_request_id ON public.request_cost_tracking(request_id);
CREATE INDEX idx_analytics_snapshots_type_period ON public.analytics_snapshots(snapshot_type, time_period);
CREATE INDEX idx_webhook_deliveries_endpoint_id ON public.webhook_deliveries(endpoint_id);
CREATE INDEX idx_digital_signatures_request_id ON public.digital_signatures(request_id);
CREATE INDEX idx_compliance_audit_logs_entity ON public.compliance_audit_logs(entity_type, entity_id);

-- Add triggers for updated_at
CREATE TRIGGER update_request_comments_updated_at
  BEFORE UPDATE ON public.request_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_conditions_updated_at
  BEFORE UPDATE ON public.workflow_conditions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_actions_updated_at
  BEFORE UPDATE ON public.workflow_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_request_cost_tracking_updated_at
  BEFORE UPDATE ON public.request_cost_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_endpoints_updated_at
  BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically log compliance audit events
CREATE OR REPLACE FUNCTION public.log_compliance_audit()
RETURNS TRIGGER AS $$
DECLARE
  current_org_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user and organization
  SELECT organization_id INTO current_org_id FROM public.users WHERE id = auth.uid();
  current_user_id := auth.uid();
  
  -- Only log if we have a valid user and organization
  IF current_user_id IS NOT NULL AND current_org_id IS NOT NULL THEN
    INSERT INTO public.compliance_audit_logs (
      organization_id,
      entity_type,
      entity_id,
      action,
      user_id,
      changes,
      ip_address,
      user_agent
    ) VALUES (
      current_org_id,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      current_user_id,
      CASE 
        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
        ELSE jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      END,
      inet '127.0.0.1', -- Placeholder - would be populated by application
      'Lovable App' -- Placeholder - would be populated by application
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;