-- Create enhanced tables for improved finance system

-- POS System configurations for multi-system support
CREATE TABLE public.pos_system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  system_name TEXT NOT NULL, -- 'brink', 'square', 'toast', 'lightspeed', 'clover', 'custom'
  config_data JSONB NOT NULL DEFAULT '{}', -- parsing rules, field mappings, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Upload batches for tracking multi-file uploads
CREATE TABLE public.upload_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  batch_name TEXT,
  total_files INTEGER NOT NULL DEFAULT 0,
  processed_files INTEGER NOT NULL DEFAULT 0,
  failed_files INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced data validation log
CREATE TABLE public.data_validation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.upload_batches(id) ON DELETE CASCADE,
  sales_data_id UUID REFERENCES public.sales_data(id) ON DELETE CASCADE,
  validation_type TEXT NOT NULL, -- 'anomaly', 'missing_field', 'format_error', 'business_rule'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'error', 'critical'
  field_name TEXT,
  expected_value TEXT,
  actual_value TEXT,
  message TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Parsed data staging for preview before final upload
CREATE TABLE public.parsed_data_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.upload_batches(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  pos_system TEXT NOT NULL,
  confidence_score NUMERIC(5,2) DEFAULT 0, -- 0-100 confidence in parsing accuracy
  extracted_data JSONB NOT NULL,
  validation_errors JSONB DEFAULT '[]',
  user_corrections JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'needs_review'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.users(id)
);

-- Analytics snapshots for performance tracking
CREATE TABLE public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  team_id UUID REFERENCES public.teams(id),
  location TEXT,
  metrics JSONB NOT NULL, -- pre-calculated metrics for fast dashboard loading
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.pos_system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_validation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parsed_data_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization isolation
CREATE POLICY "pos_configs_org_isolation" ON public.pos_system_configs
  FOR ALL USING (organization_id = get_current_user_organization_id());

CREATE POLICY "upload_batches_org_isolation" ON public.upload_batches
  FOR ALL USING (organization_id = get_current_user_organization_id());

CREATE POLICY "validation_log_org_isolation" ON public.data_validation_log
  FOR ALL USING (organization_id = get_current_user_organization_id());

CREATE POLICY "staging_org_isolation" ON public.parsed_data_staging
  FOR ALL USING (organization_id = get_current_user_organization_id());

CREATE POLICY "analytics_org_isolation" ON public.analytics_snapshots
  FOR ALL USING (organization_id = get_current_user_organization_id());

-- Create indexes for performance
CREATE INDEX idx_pos_configs_org_system ON public.pos_system_configs(organization_id, system_name);
CREATE INDEX idx_upload_batches_org_status ON public.upload_batches(organization_id, status);
CREATE INDEX idx_validation_log_batch ON public.data_validation_log(batch_id);
CREATE INDEX idx_staging_batch_status ON public.parsed_data_staging(batch_id, status);
CREATE INDEX idx_analytics_org_date ON public.analytics_snapshots(organization_id, snapshot_date);

-- Add triggers for updated_at
CREATE TRIGGER update_pos_configs_updated_at
  BEFORE UPDATE ON public.pos_system_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default POS system configurations
INSERT INTO public.pos_system_configs (organization_id, system_name, config_data, created_by)
SELECT 
  o.id,
  system_name,
  config_data::jsonb,
  o.created_by
FROM public.organizations o
CROSS JOIN (
  VALUES
  ('brink', '{"patterns": {"grossSales": ["Gross Sales[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)", "Total Gross[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)"], "netSales": ["Net Sales[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)", "Total Net[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)"], "orderCount": ["Order Count[\\\\s:]*([0-9,]+)", "Total Orders[\\\\s:]*([0-9,]+)"]}}'),
  ('square', '{"patterns": {"grossSales": ["Gross Amount[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)", "Total Sales[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)"], "netSales": ["Net Amount[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)", "Net Sales[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)"], "orderCount": ["Transaction Count[\\\\s:]*([0-9,]+)", "Orders[\\\\s:]*([0-9,]+)"]}}'),
  ('toast', '{"patterns": {"grossSales": ["Total Sales[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)", "Gross Revenue[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)"], "netSales": ["Net Sales[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)", "Revenue[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)"], "orderCount": ["Orders[\\\\s:]*([0-9,]+)", "Check Count[\\\\s:]*([0-9,]+)"]}}'),
  ('lightspeed', '{"patterns": {"grossSales": ["Total Revenue[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)", "Gross Sales[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)"], "netSales": ["Net Revenue[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)", "Net Sales[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)"], "orderCount": ["Sale Count[\\\\s:]*([0-9,]+)", "Transactions[\\\\s:]*([0-9,]+)"]}}'),
  ('clover', '{"patterns": {"grossSales": ["Gross Sales[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)", "Total Revenue[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)"], "netSales": ["Net Sales[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)", "Revenue[\\\\s:$]*([0-9,]+\\\\.?[0-9]*)"], "orderCount": ["Orders[\\\\s:]*([0-9,]+)", "Transaction Count[\\\\s:]*([0-9,]+)"]}}')