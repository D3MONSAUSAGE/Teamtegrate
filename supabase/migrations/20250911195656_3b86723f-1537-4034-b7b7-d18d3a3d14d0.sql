-- Fix the search_path for the generate_daily_checklist_executions function
CREATE OR REPLACE FUNCTION generate_daily_checklist_executions(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert checklist executions for the target date if they don't exist
  INSERT INTO checklist_executions (
    checklist_id,
    assigned_user_id,
    execution_date,
    status,
    organization_id
  )
  SELECT DISTINCT
    c.id,
    cu.user_id,
    target_date,
    'pending'::execution_status,
    c.organization_id
  FROM checklists c
  JOIN checklist_users cu ON c.id = cu.checklist_id
  WHERE c.is_active = true
    AND (c.schedule_days IS NULL OR target_date::text = ANY(c.schedule_days))
    AND NOT EXISTS (
      SELECT 1 FROM checklist_executions ce2 
      WHERE ce2.checklist_id = c.id 
        AND ce2.assigned_user_id = cu.user_id 
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