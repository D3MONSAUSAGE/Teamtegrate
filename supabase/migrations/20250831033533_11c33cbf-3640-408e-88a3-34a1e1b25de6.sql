-- Create function to get detailed employee tasks for weekly dashboard
CREATE OR REPLACE FUNCTION public.get_employee_detailed_tasks(target_user_id uuid, start_date date, end_date date)
RETURNS TABLE(
  task_id text,
  title text,
  description text,
  priority text,
  status text,
  deadline timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  project_id text,
  project_title text,
  time_spent_minutes integer,
  is_overdue boolean,
  days_until_due integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org_id uuid;
  user_tz text;
BEGIN
  -- Verify the caller and target user are in the same organization
  SELECT organization_id, timezone INTO org_id, user_tz FROM public.users WHERE id = target_user_id;
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  IF org_id != get_current_user_organization_id() THEN
    RAISE EXCEPTION 'Access denied: Target user is not in your organization';
  END IF;
  user_tz := COALESCE(user_tz, 'UTC');

  RETURN QUERY
  SELECT 
    t.id::text AS task_id,
    t.title,
    t.description,
    t.priority,
    t.status,
    t.deadline,
    t.created_at,
    t.updated_at,
    t.project_id,
    COALESCE(p.title, 'No Project') AS project_title,
    COALESCE(
      (SELECT SUM(te.duration_minutes)::int 
       FROM public.time_entries te 
       WHERE te.task_id = t.id 
         AND te.user_id = target_user_id
         AND te.clock_out IS NOT NULL
         AND DATE(te.clock_in AT TIME ZONE user_tz) BETWEEN start_date AND end_date
      ), 0
    ) AS time_spent_minutes,
    -- Calculate if task is overdue
    CASE 
      WHEN t.deadline IS NOT NULL AND t.status != 'Completed' AND DATE(t.deadline AT TIME ZONE user_tz) < CURRENT_DATE 
      THEN TRUE 
      ELSE FALSE 
    END AS is_overdue,
    -- Calculate days until due (negative if overdue)
    CASE 
      WHEN t.deadline IS NOT NULL 
      THEN DATE(t.deadline AT TIME ZONE user_tz) - CURRENT_DATE
      ELSE NULL 
    END AS days_until_due
  FROM public.tasks t
  LEFT JOIN public.projects p ON t.project_id = p.id
  WHERE t.organization_id = org_id
    AND (
      -- Tasks created by the user OR assigned to the user
      (t.user_id = target_user_id::text)
      OR (t.assigned_to_id = target_user_id::text)
      OR (t.assigned_to_ids IS NOT NULL AND target_user_id::text = ANY(t.assigned_to_ids))
    )
    AND (
      -- Tasks created, updated, or due within the date range
      DATE(t.created_at AT TIME ZONE user_tz) BETWEEN start_date AND end_date
      OR DATE(t.updated_at AT TIME ZONE user_tz) BETWEEN start_date AND end_date
      OR (t.deadline IS NOT NULL AND DATE(t.deadline AT TIME ZONE user_tz) BETWEEN start_date AND end_date)
    )
  ORDER BY 
    CASE 
      WHEN t.status = 'Completed' THEN 3
      WHEN is_overdue THEN 1
      ELSE 2
    END,
    t.deadline ASC NULLS LAST,
    t.created_at DESC;
END;
$function$;