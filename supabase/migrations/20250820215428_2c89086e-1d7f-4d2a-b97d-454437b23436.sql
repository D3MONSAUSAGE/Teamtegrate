-- Fix completed_at field type and add archive fields to tasks table
ALTER TABLE tasks 
  ALTER COLUMN completed_at TYPE timestamp with time zone 
  USING CASE 
    WHEN completed_at IS NULL OR completed_at = '' THEN NULL
    ELSE completed_at::timestamp with time zone
  END;

-- Add archive fields to tasks table
ALTER TABLE tasks 
  ADD COLUMN archived_at timestamp with time zone,
  ADD COLUMN is_archived boolean DEFAULT false;

-- Create archive_settings table for configurable thresholds
CREATE TABLE archive_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  threshold_days integer DEFAULT 90 CHECK (threshold_days > 0),
  auto_archive_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(organization_id)
);

-- Enable RLS on archive_settings table
ALTER TABLE archive_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for archive_settings
CREATE POLICY "Users can view their own archive settings"
  ON archive_settings FOR SELECT
  USING (
    user_id = auth.uid() OR 
    (organization_id = get_current_user_organization_id() AND user_id IS NULL)
  );

CREATE POLICY "Users can manage their own archive settings"
  ON archive_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage organization archive settings"
  ON archive_settings FOR ALL
  USING (
    organization_id = get_current_user_organization_id() AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Performance indexes for archive queries
CREATE INDEX idx_tasks_archive_performance 
  ON tasks (organization_id, status, completed_at) 
  WHERE is_archived = false OR is_archived IS NULL;

CREATE INDEX idx_tasks_archived_lookup 
  ON tasks (organization_id, archived_at, status) 
  WHERE is_archived = true;

CREATE INDEX idx_tasks_auto_archive_candidates 
  ON tasks (completed_at, organization_id) 
  WHERE status = 'Completed' AND (is_archived = false OR is_archived IS NULL);

-- Update trigger to set completed_at when task status changes to Completed
CREATE OR REPLACE FUNCTION update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set completed_at when status changes to Completed
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    NEW.completed_at = now();
  END IF;
  
  -- Clear completed_at and archive status if task is reopened
  IF NEW.status != 'Completed' AND OLD.status = 'Completed' THEN
    NEW.completed_at = NULL;
    NEW.is_archived = false;
    NEW.archived_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for completed_at updates
DROP TRIGGER IF EXISTS trigger_update_task_completed_at ON tasks;
CREATE TRIGGER trigger_update_task_completed_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_completed_at();

-- Function to get archive threshold for user/organization
CREATE OR REPLACE FUNCTION get_archive_threshold_days(user_id_param uuid)
RETURNS integer AS $$
DECLARE
  threshold_days integer;
  user_org_id uuid;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO user_org_id 
  FROM users WHERE id = user_id_param;
  
  -- First try user-specific setting
  SELECT threshold_days INTO threshold_days
  FROM archive_settings
  WHERE user_id = user_id_param;
  
  -- If no user setting, try organization setting
  IF threshold_days IS NULL THEN
    SELECT threshold_days INTO threshold_days
    FROM archive_settings
    WHERE organization_id = user_org_id AND user_id IS NULL;
  END IF;
  
  -- Default to 90 days if no setting found
  RETURN COALESCE(threshold_days, 90);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;