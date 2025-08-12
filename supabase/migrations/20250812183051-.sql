-- Employee Reports RPCs
-- Task stats for an employee within a date range
CREATE OR REPLACE FUNCTION public.get_employee_task_stats(
  target_user_id uuid,
  start_date date,
  end_date date
)
RETURNS TABLE (
  total integer,
  completed integer,
  in_progress integer,
  overdue integer
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT t.*
    FROM public.tasks t
    WHERE (t.assigned_to_id = target_user_id OR t.user_id = target_user_id)
      AND (t.created_at::date BETWEEN start_date AND end_date)
  )
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE t.status ILIKE 'completed')::int AS completed,
    COUNT(*) FILTER (WHERE t.status NOT ILIKE 'completed')::int AS in_progress,
    COUNT(*) FILTER (WHERE t.deadline IS NOT NULL AND t.deadline::timestamp < now() AND t.status NOT ILIKE 'completed')::int AS overdue
  FROM filtered t;
END;
$$ LANGUAGE plpgsql STABLE;

-- Hours stats for an employee within a date range
CREATE OR REPLACE FUNCTION public.get_employee_hours_stats(
  target_user_id uuid,
  start_date date,
  end_date date
)
RETURNS TABLE (
  total_minutes integer,
  session_count integer,
  overtime_minutes integer
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT te.*
    FROM public.time_entries te
    WHERE te.user_id = target_user_id
      AND te.clock_in::date BETWEEN start_date AND end_date
  ),
  base AS (
    SELECT 
      COALESCE(SUM(COALESCE(te.duration_minutes, 0)), 0)::int AS total_minutes,
      COUNT(*)::int AS session_count,
      COALESCE(SUM(CASE WHEN COALESCE(te.duration_minutes, 0) > 480 THEN COALESCE(te.duration_minutes, 0) - 480 ELSE 0 END), 0)::int AS overtime_minutes
    FROM filtered te
  )
  SELECT total_minutes, session_count, overtime_minutes FROM base;
END;
$$ LANGUAGE plpgsql STABLE;

-- Project contributions (tasks per project) for an employee within a date range
CREATE OR REPLACE FUNCTION public.get_employee_project_contributions(
  target_user_id uuid,
  start_date date,
  end_date date
)
RETURNS TABLE (
  project_id uuid,
  project_title text,
  task_count integer,
  completed_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS project_id,
    p.title AS project_title,
    COUNT(t.id)::int AS task_count,
    COUNT(t.id) FILTER (WHERE t.status ILIKE 'completed')::int AS completed_count
  FROM public.tasks t
  LEFT JOIN public.projects p ON p.id = t.project_id
  WHERE (t.assigned_to_id = target_user_id OR t.user_id = target_user_id)
    AND (t.created_at::date BETWEEN start_date AND end_date)
  GROUP BY p.id, p.title
  ORDER BY task_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;