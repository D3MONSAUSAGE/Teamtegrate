-- Drop existing functions
DROP FUNCTION IF EXISTS get_employee_task_stats(uuid,date,date);
DROP FUNCTION IF EXISTS get_employee_project_contributions(uuid,date,date);

-- Recreate get_employee_task_stats function with correct return type
CREATE OR REPLACE FUNCTION get_employee_task_stats(
  target_user_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  completed_tasks INTEGER,
  total_tasks INTEGER,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure user has access to organization data
  IF NOT (
    target_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'manager')
      AND organization_id = get_current_user_organization_id()
    )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(COUNT(CASE WHEN t.status = 'Completed' THEN 1 END), 0)::INTEGER as completed_tasks,
    COALESCE(COUNT(*), 0)::INTEGER as total_tasks,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN t.status = 'Completed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 
        0::NUMERIC
    END as completion_rate
  FROM tasks t
  WHERE t.user_id = target_user_id::text
    AND t.organization_id = get_current_user_organization_id()
    AND t.created_at::DATE BETWEEN start_date AND end_date;
END;
$$;

-- Recreate get_employee_project_contributions function with fixed column reference
CREATE OR REPLACE FUNCTION get_employee_project_contributions(
  target_user_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  project_title TEXT,
  task_count INTEGER,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure user has access to organization data
  IF NOT (
    target_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'manager')
      AND organization_id = get_current_user_organization_id()
    )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(p.title, 'No Project') as project_title,
    COUNT(t.*)::INTEGER as task_count,
    CASE 
      WHEN COUNT(t.*) > 0 THEN 
        ROUND((COUNT(CASE WHEN t.status = 'Completed' THEN 1 END)::NUMERIC / COUNT(t.*)::NUMERIC) * 100, 2)
      ELSE 
        0::NUMERIC
    END as completion_rate
  FROM tasks t
  LEFT JOIN projects p ON t.project_id = p.id
  WHERE t.user_id = target_user_id::text
    AND t.organization_id = get_current_user_organization_id()
    AND t.created_at::DATE BETWEEN start_date AND end_date  -- Use parameter names directly
  GROUP BY p.title
  ORDER BY task_count DESC;
END;
$$;