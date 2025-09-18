-- Security Fix: Address final remaining SECURITY DEFINER table-returning functions

-- Fix get_employee_daily_task_completion
CREATE OR REPLACE FUNCTION public.get_employee_daily_task_completion(target_user_id uuid, start_date date, end_date date)
RETURNS TABLE(completion_date date, tasks_completed integer, tasks_created integer, completion_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  caller_role text;
  caller_org_id uuid;
BEGIN
  -- Get caller's role and organization
  SELECT role, organization_id INTO caller_role, caller_org_id 
  FROM public.users WHERE id = auth.uid();
  
  IF caller_org_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: User not found';
  END IF;
  
  -- Enhanced access control: Only allow if user is viewing their own data OR caller has management role
  IF target_user_id != auth.uid() AND caller_role NOT IN ('admin', 'superadmin', 'manager') THEN
    RAISE EXCEPTION 'Access denied: Only managers and admins can view other users'' task completion data';
  END IF;
  
  -- Verify target user is in same organization
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = target_user_id 
    AND organization_id = caller_org_id
  ) THEN
    RAISE EXCEPTION 'Access denied: Target user not in your organization';
  END IF;

  RETURN QUERY
  WITH daily_stats AS (
    SELECT 
      DATE(t.completed_at) as completion_date,
      COUNT(CASE WHEN t.status = 'Completed' THEN 1 END) as tasks_completed,
      COUNT(CASE WHEN DATE(t.created_at) = DATE(t.completed_at) THEN 1 END) as tasks_created
    FROM public.tasks t
    WHERE (
      t.user_id = target_user_id::text OR 
      t.assigned_to_id = target_user_id::text OR 
      target_user_id::text = ANY(t.assigned_to_ids)
    )
    AND t.organization_id = caller_org_id
    AND DATE(COALESCE(t.completed_at, t.created_at)) BETWEEN start_date AND end_date
    GROUP BY DATE(t.completed_at)
  )
  SELECT 
    ds.completion_date,
    ds.tasks_completed::integer,
    ds.tasks_created::integer,
    CASE 
      WHEN ds.tasks_created > 0 THEN 
        ROUND((ds.tasks_completed::NUMERIC / ds.tasks_created::NUMERIC) * 100, 2)
      ELSE 0::NUMERIC
    END as completion_rate
  FROM daily_stats ds
  WHERE ds.completion_date IS NOT NULL
  ORDER BY ds.completion_date;
END;
$function$;

-- Fix get_comprehensive_employee_report
CREATE OR REPLACE FUNCTION public.get_comprehensive_employee_report(target_user_id uuid, start_date date, end_date date, report_granularity text DEFAULT 'daily')
RETURNS TABLE(period_date date, period_label text, total_tasks integer, completed_tasks integer, in_progress_tasks integer, overdue_tasks integer, completion_rate numeric, total_minutes_worked integer, session_count integer, overtime_minutes integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  caller_role text;
  caller_org_id uuid;
  user_tz text;
BEGIN
  -- Get caller's role and organization
  SELECT role, organization_id INTO caller_role, caller_org_id 
  FROM public.users WHERE id = auth.uid();
  
  IF caller_org_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: User not found';
  END IF;
  
  -- Enhanced access control: Only allow if user is viewing their own report OR caller has management role
  IF target_user_id != auth.uid() AND caller_role NOT IN ('admin', 'superadmin', 'manager') THEN
    RAISE EXCEPTION 'Access denied: Only managers and admins can view comprehensive employee reports';
  END IF;
  
  -- Get target user's timezone and verify they're in same organization
  SELECT timezone, organization_id INTO user_tz, caller_org_id 
  FROM public.users WHERE id = target_user_id;
  
  IF caller_org_id IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  IF caller_org_id != get_current_user_organization_id() THEN
    RAISE EXCEPTION 'Access denied: Target user not in your organization';
  END IF;
  
  user_tz := COALESCE(user_tz, 'UTC');

  RETURN QUERY
  WITH date_series AS (
    SELECT d::date as period_date
    FROM generate_series(start_date, end_date, '1 day'::interval) AS d
  ),
  task_stats AS (
    SELECT 
      DATE(t.created_at AT TIME ZONE user_tz) as task_date,
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN t.status = 'Completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN t.status IN ('In Progress', 'Started') THEN 1 END) as in_progress_tasks,
      COUNT(CASE 
        WHEN t.deadline IS NOT NULL 
        AND t.status != 'Completed' 
        AND DATE(t.deadline AT TIME ZONE user_tz) < CURRENT_DATE 
        THEN 1 
      END) as overdue_tasks
    FROM public.tasks t
    WHERE (
      t.user_id = target_user_id::text OR 
      t.assigned_to_id = target_user_id::text OR 
      target_user_id::text = ANY(t.assigned_to_ids)
    )
    AND t.organization_id = caller_org_id
    AND DATE(t.created_at AT TIME ZONE user_tz) BETWEEN start_date AND end_date
    GROUP BY DATE(t.created_at AT TIME ZONE user_tz)
  ),
  time_stats AS (
    SELECT 
      DATE(te.clock_in AT TIME ZONE user_tz) as work_date,
      COALESCE(SUM(te.duration_minutes), 0) as total_minutes_worked,
      COUNT(*) as session_count,
      GREATEST(0, COALESCE(SUM(te.duration_minutes), 0) - 480) as overtime_minutes
    FROM public.time_entries te
    WHERE te.user_id = target_user_id
    AND te.organization_id = caller_org_id
    AND te.clock_out IS NOT NULL
    AND DATE(te.clock_in AT TIME ZONE user_tz) BETWEEN start_date AND end_date
    GROUP BY DATE(te.clock_in AT TIME ZONE user_tz)
  )
  SELECT 
    ds.period_date,
    to_char(ds.period_date, 'YYYY-MM-DD') as period_label,
    COALESCE(ts.total_tasks, 0)::integer as total_tasks,
    COALESCE(ts.completed_tasks, 0)::integer as completed_tasks,
    COALESCE(ts.in_progress_tasks, 0)::integer as in_progress_tasks,
    COALESCE(ts.overdue_tasks, 0)::integer as overdue_tasks,
    CASE 
      WHEN COALESCE(ts.total_tasks, 0) > 0 THEN 
        ROUND((COALESCE(ts.completed_tasks, 0)::NUMERIC / ts.total_tasks::NUMERIC) * 100, 2)
      ELSE 0::NUMERIC
    END as completion_rate,
    COALESCE(tims.total_minutes_worked, 0)::integer as total_minutes_worked,
    COALESCE(tims.session_count, 0)::integer as session_count,
    COALESCE(tims.overtime_minutes, 0)::integer as overtime_minutes
  FROM date_series ds
  LEFT JOIN task_stats ts ON ds.period_date = ts.task_date
  LEFT JOIN time_stats tims ON ds.period_date = tims.work_date
  ORDER BY ds.period_date;
END;
$function$;