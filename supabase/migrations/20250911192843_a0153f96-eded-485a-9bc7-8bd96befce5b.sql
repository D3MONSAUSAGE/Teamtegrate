-- Function to generate daily checklist executions based on scheduled days
CREATE OR REPLACE FUNCTION generate_daily_checklist_executions(target_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_weekday text;
  assignment_record RECORD;
  user_record RECORD;
  execution_count integer := 0;
BEGIN
  -- Get the day of week for the target date
  current_weekday := LOWER(TO_CHAR(target_date, 'Day'));
  current_weekday := TRIM(current_weekday);

  -- Loop through all active checklist assignments
  FOR assignment_record IN
    SELECT ca.*, c.scheduled_days
    FROM checklist_assignments ca
    JOIN checklists c ON ca.checklist_id = c.id
    WHERE c.status = 'active'
    AND c.scheduled_days ? current_weekday
  LOOP
    -- Handle direct user assignments
    IF assignment_record.assigned_to_user_id IS NOT NULL THEN
      INSERT INTO checklist_executions (
        checklist_id,
        organization_id,
        assigned_to_user_id,
        execution_date,
        status
      )
      VALUES (
        assignment_record.checklist_id,
        assignment_record.organization_id,
        assignment_record.assigned_to_user_id,
        target_date,
        'pending'
      )
      ON CONFLICT (checklist_id, assigned_to_user_id, execution_date) DO NOTHING;
      
      execution_count := execution_count + 1;
    END IF;

    -- Handle team assignments - create executions for each team member
    IF assignment_record.assigned_to_team_id IS NOT NULL THEN
      FOR user_record IN
        SELECT tm.user_id, u.organization_id
        FROM team_memberships tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = assignment_record.assigned_to_team_id
        AND u.organization_id = assignment_record.organization_id
      LOOP
        INSERT INTO checklist_executions (
          checklist_id,
          organization_id,
          assigned_to_user_id,
          execution_date,
          status
        )
        VALUES (
          assignment_record.checklist_id,
          assignment_record.organization_id,
          user_record.user_id,
          target_date,
          'pending'
        )
        ON CONFLICT (checklist_id, assigned_to_user_id, execution_date) DO NOTHING;
        
        execution_count := execution_count + 1;
      END LOOP;
    END IF;

    -- Handle role-based assignments
    IF assignment_record.assigned_role IS NOT NULL THEN
      FOR user_record IN
        SELECT u.id as user_id, u.organization_id
        FROM users u
        WHERE u.role = assignment_record.assigned_role
        AND u.organization_id = assignment_record.organization_id
      LOOP
        INSERT INTO checklist_executions (
          checklist_id,
          organization_id,
          assigned_to_user_id,
          execution_date,
          status
        )
        VALUES (
          assignment_record.checklist_id,
          assignment_record.organization_id,
          user_record.user_id,
          target_date,
          'pending'
        )
        ON CONFLICT (checklist_id, assigned_to_user_id, execution_date) DO NOTHING;
        
        execution_count := execution_count + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- Create execution items for all new executions
  INSERT INTO checklist_execution_items (
    execution_id,
    checklist_item_id,
    organization_id,
    is_completed
  )
  SELECT 
    ce.id,
    ci.id,
    ce.organization_id,
    false
  FROM checklist_executions ce
  JOIN checklist_items ci ON ce.checklist_id = ci.checklist_id
  WHERE ce.execution_date = target_date
  AND NOT EXISTS (
    SELECT 1 FROM checklist_execution_items cei 
    WHERE cei.execution_id = ce.id AND cei.checklist_item_id = ci.id
  );

  RETURN jsonb_build_object(
    'success', true,
    'executions_generated', execution_count,
    'date', target_date,
    'weekday', current_weekday
  );
END;
$$;

-- Create unique constraint to prevent duplicate executions
ALTER TABLE checklist_executions 
ADD CONSTRAINT unique_execution_per_user_date 
UNIQUE (checklist_id, assigned_to_user_id, execution_date);