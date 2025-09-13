-- Drop the old broken function
DROP FUNCTION IF EXISTS generate_daily_checklist_executions(date);

-- Create a corrected function that uses the right column names and table structure
CREATE OR REPLACE FUNCTION generate_daily_checklist_executions(target_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert checklist executions for individual user assignments
  INSERT INTO checklist_executions (
    checklist_id,
    assigned_to_user_id,
    execution_date,
    status,
    organization_id
  )
  SELECT DISTINCT
    c.id,
    ca.assigned_to_user_id,
    target_date,
    'pending'::execution_status,
    c.organization_id
  FROM checklists c
  JOIN checklist_assignments ca ON c.id = ca.checklist_id
  WHERE c.is_active = true
    AND ca.assigned_to_user_id IS NOT NULL
    AND (c.scheduled_days IS NULL OR EXTRACT(DOW FROM target_date) = ANY(c.scheduled_days))
    AND NOT EXISTS (
      SELECT 1 FROM checklist_executions ce2 
      WHERE ce2.checklist_id = c.id 
        AND ce2.assigned_to_user_id = ca.assigned_to_user_id 
        AND ce2.execution_date = target_date
    );

  -- Insert checklist executions for team assignments
  INSERT INTO checklist_executions (
    checklist_id,
    assigned_to_user_id,
    execution_date,
    status,
    organization_id
  )
  SELECT DISTINCT
    c.id,
    tm.user_id,
    target_date,
    'pending'::execution_status,
    c.organization_id
  FROM checklists c
  JOIN checklist_assignments ca ON c.id = ca.checklist_id
  JOIN team_memberships tm ON ca.assigned_to_team_id = tm.team_id
  WHERE c.is_active = true
    AND ca.assigned_to_team_id IS NOT NULL
    AND (c.scheduled_days IS NULL OR EXTRACT(DOW FROM target_date) = ANY(c.scheduled_days))
    AND NOT EXISTS (
      SELECT 1 FROM checklist_executions ce2 
      WHERE ce2.checklist_id = c.id 
        AND ce2.assigned_to_user_id = tm.user_id 
        AND ce2.execution_date = target_date
    );

  -- Insert checklist execution items for newly created executions
  INSERT INTO checklist_execution_items (
    execution_id,
    checklist_item_id,
    is_completed,
    is_verified,
    organization_id
  )
  SELECT DISTINCT
    ce.id,
    ci.id,
    false,
    false,
    ce.organization_id
  FROM checklist_executions ce
  JOIN checklist_items ci ON ce.checklist_id = ci.checklist_id
  WHERE ce.execution_date = target_date
    AND NOT EXISTS (
      SELECT 1 FROM checklist_execution_items cei 
      WHERE cei.execution_id = ce.id 
        AND cei.checklist_item_id = ci.id
    );
END;
$$;