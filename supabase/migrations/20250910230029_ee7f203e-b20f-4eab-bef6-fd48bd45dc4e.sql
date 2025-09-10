-- Create enhanced tables for improved finance system

-- POS System configurations for multi-system support
CREATE TABLE public.pos_system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  system_name TEXT NOT NULL, 
  config_data JSONB NOT NULL DEFAULT '{}',
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
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced data validation log
CREATE TABLE public.data_validation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.upload_batches(id) ON DELETE CASCADE,
  sales_data_id UUID REFERENCES public.sales_data(id) ON DELETE CASCADE,
  validation_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
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
  confidence_score NUMERIC(5,2) DEFAULT 0,
  extracted_data JSONB NOT NULL,
  validation_errors JSONB DEFAULT '[]',
  user_corrections JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.users(id)
);

-- Analytics snapshots for performance tracking
CREATE TABLE public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  period_type TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  location TEXT,
  metrics JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pos_system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_validation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parsed_data_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies
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

-- Create indexes
CREATE INDEX idx_pos_configs_org_system ON public.pos_system_configs(organization_id, system_name);
CREATE INDEX idx_upload_batches_org_status ON public.upload_batches(organization_id, status);
CREATE INDEX idx_validation_log_batch ON public.data_validation_log(batch_id);
CREATE INDEX idx_staging_batch_status ON public.parsed_data_staging(batch_id, status);
CREATE INDEX idx_analytics_org_date ON public.analytics_snapshots(organization_id, snapshot_date);

-- Add triggers
CREATE TRIGGER update_pos_configs_updated_at
  BEFORE UPDATE ON public.pos_system_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();