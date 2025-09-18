-- Security Fix: Address remaining SECURITY DEFINER table-returning functions

-- 1. Fix get_employee_hours_stats - add admin role requirement
CREATE OR REPLACE FUNCTION public.get_employee_hours_stats(target_user_id uuid, start_date date, end_date date)
RETURNS TABLE(day date, minutes integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  org_id uuid;
  user_tz text;
  caller_role text;
BEGIN
  -- Check caller's role and organization
  SELECT role, organization_id INTO caller_role, org_id 
  FROM public.users WHERE id = auth.uid();
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: User not found';
  END IF;
  
  -- Only allow admins, managers, and superadmins to view employee hours
  IF caller_role NOT IN ('admin', 'superadmin', 'manager') THEN
    RAISE EXCEPTION 'Access denied: Only managers and admins can view employee hours';
  END IF;
  
  -- Verify target user is in same organization
  SELECT organization_id, timezone INTO org_id, user_tz 
  FROM public.users WHERE id = target_user_id;
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  IF org_id != get_current_user_organization_id() THEN
    RAISE EXCEPTION 'Access denied: Target user is not in your organization';
  END IF;
  
  user_tz := COALESCE(user_tz, 'UTC');

  RETURN QUERY
  WITH days AS (
    SELECT d::date AS d
    FROM generate_series(start_date, end_date, interval '1 day') AS g(d)
  )
  SELECT 
    d.d AS day,
    COALESCE((
      SELECT SUM(te.duration_minutes)::int
      FROM public.time_entries te
      WHERE te.user_id = target_user_id
        AND te.organization_id = org_id
        AND te.clock_out IS NOT NULL
        AND DATE(te.clock_in AT TIME ZONE user_tz) = d.d
    ), 0) AS minutes
  FROM days d
  ORDER BY d.d;
END;
$function$;

-- 2. Fix get_employee_detailed_tasks - add admin role requirement
CREATE OR REPLACE FUNCTION public.get_employee_detailed_tasks(target_user_id uuid, start_date date, end_date date)
RETURNS TABLE(task_id text, title text, description text, priority text, status text, deadline timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, project_id text, project_title text, time_spent_minutes integer, is_overdue boolean, days_until_due integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  org_id uuid;
  user_tz text;
  caller_role text;
BEGIN
  -- Check caller's role and organization
  SELECT role, organization_id INTO caller_role, org_id 
  FROM public.users WHERE id = auth.uid();
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: User not found';
  END IF;
  
  -- Only allow admins, managers, and superadmins to view detailed employee tasks
  IF caller_role NOT IN ('admin', 'superadmin', 'manager') THEN
    RAISE EXCEPTION 'Access denied: Only managers and admins can view detailed employee tasks';
  END IF;
  
  -- Verify target user is in same organization
  SELECT organization_id, timezone INTO org_id, user_tz 
  FROM public.users WHERE id = target_user_id;
  
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
    CASE 
      WHEN t.deadline IS NOT NULL AND t.status != 'Completed' AND DATE(t.deadline AT TIME ZONE user_tz) < CURRENT_DATE 
      THEN TRUE 
      ELSE FALSE 
    END AS is_overdue,
    CASE 
      WHEN t.deadline IS NOT NULL 
      THEN DATE(t.deadline AT TIME ZONE user_tz) - CURRENT_DATE
      ELSE NULL 
    END AS days_until_due
  FROM public.tasks t
  LEFT JOIN public.projects p ON t.project_id = p.id
  WHERE t.organization_id = org_id
    AND (
      (t.user_id = target_user_id::text)
      OR (t.assigned_to_id = target_user_id::text)
      OR (t.assigned_to_ids IS NOT NULL AND target_user_id::text = ANY(t.assigned_to_ids))
    )
    AND (
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