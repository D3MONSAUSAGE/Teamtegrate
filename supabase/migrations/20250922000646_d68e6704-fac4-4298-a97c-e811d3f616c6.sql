-- Enhanced Centralized Checklist System Migration
-- Create new tables alongside existing ones for safe migration

-- Create enums
DO $$ BEGIN
  CREATE TYPE checklist_status_v2 AS ENUM ('pending','submitted','verified','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE assignment_type_v2 AS ENUM ('individual','team','role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add timezone to organizations if not exists
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Create new checklist templates table
CREATE TABLE IF NOT EXISTS checklist_templates_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  code TEXT GENERATED ALWAYS AS (
    CONCAT('CLT-', TO_CHAR(created_at,'YYYY'), '-', LPAD((EXTRACT(EPOCH FROM created_at)::BIGINT % 10000)::TEXT, 4, '0'))
  ) STORED,
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  assignment_type assignment_type_v2 NOT NULL DEFAULT 'team',
  
  start_time TIME,
  end_time TIME,
  scheduled_days TEXT[] DEFAULT '{}',
  
  require_verification BOOLEAN DEFAULT true,
  scoring_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  team_id UUID,
  role_key TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create template items table
CREATE TABLE IF NOT EXISTS checklist_template_items_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES checklist_templates_v2(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  label TEXT NOT NULL,
  instructions TEXT,
  requires_photo BOOLEAN DEFAULT false,
  requires_note BOOLEAN DEFAULT false,
  default_value JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create checklist instances table
CREATE TABLE IF NOT EXISTS checklist_instances_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES checklist_templates_v2(id) ON DELETE RESTRICT,
  org_id UUID NOT NULL,
  team_id UUID,
  date DATE NOT NULL,
  display_code TEXT GENERATED ALWAYS AS (
    'CHK-' || TO_CHAR(date,'YYYYMMDD') || '-' || SUBSTR(REPLACE(id::TEXT,'-',''),1,6)
  ) STORED,
  
  status checklist_status_v2 NOT NULL DEFAULT 'pending',
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  
  executed_by UUID,
  executed_at TIMESTAMPTZ,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  manager_note TEXT,
  reject_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create item entries table
CREATE TABLE IF NOT EXISTS checklist_item_entries_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES checklist_instances_v2(id) ON DELETE CASCADE,
  template_item_id UUID NOT NULL REFERENCES checklist_template_items_v2(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL,
  
  value JSONB DEFAULT '{}'::jsonb,
  photo_urls TEXT[] DEFAULT '{}',
  note TEXT,
  
  executed_status TEXT CHECK (executed_status IN ('unchecked','pass','fail','na')) DEFAULT 'unchecked',
  verified_status TEXT CHECK (verified_status IN ('unchecked','pass','fail','na')) DEFAULT 'unchecked',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email deduplication table
CREATE TABLE IF NOT EXISTS email_outbox (
  event_id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Organization settings for checklist system
CREATE TABLE IF NOT EXISTS organization_checklist_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE,
  allow_self_verify BOOLEAN DEFAULT false,
  auto_expire_hours INTEGER DEFAULT 24,
  require_photos BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one instance per org/team/template/date
CREATE UNIQUE INDEX IF NOT EXISTS uniq_instance_per_day_v2
  ON checklist_instances_v2 (org_id, COALESCE(team_id,'00000000-0000-0000-0000-000000000000'::UUID), template_id, date);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_templates_v2_org_active ON checklist_templates_v2(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_instances_v2_org_team_date ON checklist_instances_v2(org_id, team_id, date);
CREATE INDEX IF NOT EXISTS idx_instances_v2_status ON checklist_instances_v2(status);
CREATE INDEX IF NOT EXISTS idx_instances_v2_team_date ON checklist_instances_v2(team_id, date) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entries_v2_instance ON checklist_item_entries_v2(instance_id);
CREATE INDEX IF NOT EXISTS idx_entries_v2_status ON checklist_item_entries_v2(executed_status, verified_status);

-- Scoring view with flexible verification handling
CREATE OR REPLACE VIEW v_team_checklist_scores AS
SELECT
  org_id,
  team_id,
  date,
  COUNT(*) as total_instances,
  COUNT(*) FILTER (WHERE status IN ('submitted','verified')) as executed_instances,
  COUNT(*) FILTER (WHERE status = 'verified' OR (status = 'submitted' AND NOT EXISTS (
    SELECT 1 FROM checklist_templates_v2 ct 
    WHERE ct.id = checklist_instances_v2.template_id AND ct.require_verification = true
  ))) as verified_instances,
  ROUND(100.0 * (COUNT(*) FILTER (WHERE status IN ('submitted','verified')))::NUMERIC / NULLIF(COUNT(*),0), 1) as execution_pct,
  ROUND(100.0 * (COUNT(*) FILTER (WHERE status = 'verified' OR (status = 'submitted' AND NOT EXISTS (
    SELECT 1 FROM checklist_templates_v2 ct 
    WHERE ct.id = checklist_instances_v2.template_id AND ct.require_verification = true
  ))))::NUMERIC / NULLIF(COUNT(*),0), 1) as verification_pct
FROM checklist_instances_v2
GROUP BY org_id, team_id, date;

-- Enable RLS on all new tables
ALTER TABLE checklist_templates_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_template_items_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_instances_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_item_entries_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_checklist_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Templates
CREATE POLICY "templates_v2_select_org" ON checklist_templates_v2
  FOR SELECT USING (org_id = get_current_user_organization_id());

CREATE POLICY "templates_v2_insert_managers" ON checklist_templates_v2
  FOR INSERT WITH CHECK (
    org_id = get_current_user_organization_id() AND
    created_by = auth.uid() AND
    get_current_user_role() IN ('manager','admin','superadmin')
  );

CREATE POLICY "templates_v2_update_managers" ON checklist_templates_v2
  FOR UPDATE USING (
    org_id = get_current_user_organization_id() AND
    get_current_user_role() IN ('manager','admin','superadmin')
  );

-- RLS Policies for Template Items
CREATE POLICY "template_items_v2_select_org" ON checklist_template_items_v2
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM checklist_templates_v2 ct 
    WHERE ct.id = template_id AND ct.org_id = get_current_user_organization_id()
  ));

CREATE POLICY "template_items_v2_insert_managers" ON checklist_template_items_v2
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM checklist_templates_v2 ct 
    WHERE ct.id = template_id AND ct.org_id = get_current_user_organization_id() AND
    get_current_user_role() IN ('manager','admin','superadmin')
  ));

CREATE POLICY "template_items_v2_update_managers" ON checklist_template_items_v2
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM checklist_templates_v2 ct 
    WHERE ct.id = template_id AND ct.org_id = get_current_user_organization_id() AND
    get_current_user_role() IN ('manager','admin','superadmin')
  ));

-- RLS Policies for Instances
CREATE POLICY "instances_v2_select_org_team" ON checklist_instances_v2
  FOR SELECT USING (
    org_id = get_current_user_organization_id() AND
    (team_id IS NULL OR EXISTS (
      SELECT 1 FROM team_memberships tm 
      WHERE tm.team_id = checklist_instances_v2.team_id AND tm.user_id = auth.uid()
    ) OR get_current_user_role() IN ('manager','admin','superadmin'))
  );

CREATE POLICY "instances_v2_execute_team" ON checklist_instances_v2
  FOR UPDATE USING (
    org_id = get_current_user_organization_id() AND
    status = 'pending' AND
    (team_id IS NULL OR EXISTS (
      SELECT 1 FROM team_memberships tm 
      WHERE tm.team_id = checklist_instances_v2.team_id AND tm.user_id = auth.uid()
    ) OR get_current_user_role() IN ('manager','admin','superadmin'))
  );

CREATE POLICY "instances_v2_verify_managers" ON checklist_instances_v2
  FOR UPDATE USING (
    org_id = get_current_user_organization_id() AND
    status = 'submitted' AND
    get_current_user_role() IN ('manager','admin','superadmin') AND
    (executed_by != auth.uid() OR EXISTS (
      SELECT 1 FROM organization_checklist_settings ocs 
      WHERE ocs.organization_id = org_id AND ocs.allow_self_verify = true
    ))
  );

-- RLS Policies for Item Entries
CREATE POLICY "entries_v2_select_org" ON checklist_item_entries_v2
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM checklist_instances_v2 ci 
    WHERE ci.id = instance_id AND ci.org_id = get_current_user_organization_id()
  ));

CREATE POLICY "entries_v2_execute_team" ON checklist_item_entries_v2
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM checklist_instances_v2 ci 
    WHERE ci.id = instance_id AND ci.org_id = get_current_user_organization_id() AND
    ci.status = 'pending' AND
    (ci.team_id IS NULL OR EXISTS (
      SELECT 1 FROM team_memberships tm 
      WHERE tm.team_id = ci.team_id AND tm.user_id = auth.uid()
    ) OR get_current_user_role() IN ('manager','admin','superadmin'))
  ));

CREATE POLICY "entries_v2_verify_managers" ON checklist_item_entries_v2
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM checklist_instances_v2 ci 
    WHERE ci.id = instance_id AND ci.org_id = get_current_user_organization_id() AND
    ci.status = 'submitted' AND
    get_current_user_role() IN ('manager','admin','superadmin')
  ));

-- RLS Policies for Email Outbox
CREATE POLICY "email_outbox_system" ON email_outbox
  FOR ALL USING (true);

-- RLS Policies for Organization Settings
CREATE POLICY "org_settings_select" ON organization_checklist_settings
  FOR SELECT USING (organization_id = get_current_user_organization_id());

CREATE POLICY "org_settings_manage_admins" ON organization_checklist_settings
  FOR ALL USING (
    organization_id = get_current_user_organization_id() AND
    get_current_user_role() IN ('admin','superadmin')
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column_v2()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_templates_v2_updated_at 
  BEFORE UPDATE ON checklist_templates_v2 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_v2();

CREATE TRIGGER update_instances_v2_updated_at 
  BEFORE UPDATE ON checklist_instances_v2 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_v2();

CREATE TRIGGER update_entries_v2_updated_at 
  BEFORE UPDATE ON checklist_item_entries_v2 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_v2();