-- Security Fix: Add proper access controls to remaining SECURITY DEFINER table functions

-- 1. Fix get_comprehensive_employee_report - add access control
CREATE OR REPLACE FUNCTION public.get_comprehensive_employee_report(target_user_id uuid, start_date date, end_date date, report_granularity text DEFAULT 'daily'::text)
RETURNS TABLE(period_date date, period_label text, total_tasks integer, completed_tasks integer, in_progress_tasks integer, overdue_tasks integer, completion_rate numeric, total_minutes_worked integer, sessions_count integer, overtime_minutes integer, avg_task_time numeric, projects_data jsonb, productivity_score numeric, efficiency_rating numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_date_iter date;
  week_start date;
  week_end date;
  period_start date;
  period_end date;
  user_org_id uuid;
BEGIN
  -- Security check: Only allow access to own data or by managers/admins
  SELECT organization_id INTO user_org_id 
  FROM public.users 
  WHERE id = target_user_id;
  
  IF user_org_id IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Check if current user can access this data
  IF target_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND organization_id = user_org_id
    AND role IN ('admin', 'superadmin', 'manager')
  ) THEN
    RAISE EXCEPTION 'Access denied: Can only view your own reports or you must be a manager/admin';
  END IF;
  
  -- Handle different granularities
  current_date_iter := start_date;
  
  WHILE current_date_iter <= end_date LOOP
    -- Set period boundaries based on granularity
    IF report_granularity = 'weekly' THEN
      -- For weekly, group by week starting Monday
      week_start := date_trunc('week', current_date_iter)::date;
      week_end := week_start + interval '6 days';
      period_start := week_start;
      period_end := LEAST(week_end, end_date);
      period_date := week_start;
      period_label := 'Week of ' || to_char(week_start, 'Mon DD');
    ELSE
      -- Daily granularity
      period_start := current_date_iter;
      period_end := current_date_iter;
      period_date := current_date_iter;
      period_label := to_char(current_date_iter, 'Mon DD, YYYY');
    END IF;
    
    -- Calculate task metrics for this period
    WITH task_metrics AS (
      SELECT
        COUNT(*) FILTER (WHERE 1=1) as total_task_count,
        COUNT(*) FILTER (WHERE t.status = 'Completed') as completed_task_count,
        COUNT(*) FILTER (WHERE t.status = 'In Progress') as in_progress_count,
        COUNT(*) FILTER (WHERE 
          t.status != 'Completed' AND 
          t.deadline < NOW() AND 
          DATE(t.deadline) < period_end
        ) as overdue_count,
        COALESCE(
          ROUND(
            (COUNT(*) FILTER (WHERE t.status = 'Completed')::numeric / 
             NULLIF(COUNT(*), 0)) * 100, 2
          ), 0
        ) as completion_percentage
      FROM public.tasks t
      WHERE (
        t.user_id = target_user_id::text OR 
        t.assigned_to_id = target_user_id::text OR 
        target_user_id::text = ANY(t.assigned_to_ids)
      )
      AND t.organization_id = user_org_id
      AND (
        (t.deadline IS NOT NULL AND DATE(t.deadline) BETWEEN period_start AND period_end) OR
        (t.deadline IS NULL AND DATE(t.created_at) BETWEEN period_start AND period_end)
      )
    ),
    time_metrics AS (
      SELECT
        COALESCE(SUM(te.duration_minutes), 0) as total_work_minutes,
        COUNT(*) as session_count,
        COALESCE(SUM(te.duration_minutes) FILTER (WHERE te.duration_minutes > 480), 0) as overtime_mins,
        COALESCE(AVG(te.duration_minutes), 0) as avg_session_time
      FROM public.time_entries te
      WHERE te.user_id = target_user_id
      AND te.organization_id = user_org_id
      AND DATE(te.clock_in) BETWEEN period_start AND period_end
      AND te.clock_out IS NOT NULL
    ),
    project_breakdown AS (
      SELECT
        jsonb_agg(
          jsonb_build_object(
            'project_id', COALESCE(p.id, 'no-project'),
            'project_title', COALESCE(p.title, 'No Project'),
            'task_count', project_tasks.task_count,
            'completed_count', project_tasks.completed_count,
            'time_spent_minutes', COALESCE(project_time.time_minutes, 0),
            'completion_rate', project_tasks.completion_percentage
          )
        ) as projects_json
      FROM (
        SELECT
          t.project_id,
          COUNT(*) as task_count,
          COUNT(*) FILTER (WHERE t.status = 'Completed') as completed_count,
          ROUND(
            (COUNT(*) FILTER (WHERE t.status = 'Completed')::numeric / 
             NULLIF(COUNT(*), 0)) * 100, 2
          ) as completion_percentage
        FROM public.tasks t
        WHERE (
          t.user_id = target_user_id::text OR 
          t.assigned_to_id = target_user_id::text OR 
          target_user_id::text = ANY(t.assigned_to_ids)
        )
        AND t.organization_id = user_org_id
        AND (
          (t.deadline IS NOT NULL AND DATE(t.deadline) BETWEEN period_start AND period_end) OR
          (t.deadline IS NULL AND DATE(t.created_at) BETWEEN period_start AND period_end)
        )
        GROUP BY t.project_id
      ) project_tasks
      LEFT JOIN public.projects p ON project_tasks.project_id = p.id
      LEFT JOIN (
        SELECT
          te.task_id,
          t.project_id,
          SUM(te.duration_minutes) as time_minutes
        FROM public.time_entries te
        JOIN public.tasks t ON t.id = te.task_id
        WHERE te.user_id = target_user_id
        AND te.organization_id = user_org_id
        AND DATE(te.clock_in) BETWEEN period_start AND period_end
        GROUP BY te.task_id, t.project_id
      ) project_time ON project_time.project_id = project_tasks.project_id
    )
    SELECT
      period_date,
      period_label,
      -- Task metrics
      COALESCE(tm.total_task_count, 0),
      COALESCE(tm.completed_task_count, 0),
      COALESCE(tm.in_progress_count, 0),
      COALESCE(tm.overdue_count, 0),
      COALESCE(tm.completion_percentage, 0),
      -- Time metrics  
      COALESCE(time_m.total_work_minutes, 0),
      COALESCE(time_m.session_count, 0),
      COALESCE(time_m.overtime_mins, 0),
      CASE 
        WHEN tm.completed_task_count > 0 AND time_m.total_work_minutes > 0
        THEN ROUND(time_m.total_work_minutes::numeric / tm.completed_task_count, 2)
        ELSE 0
      END,
      -- Project data
      COALESCE(pb.projects_json, '[]'::jsonb),
      -- Performance scores (calculated metrics)
      CASE
        WHEN tm.total_task_count > 0 AND time_m.total_work_minutes > 0
        THEN ROUND(
          (tm.completion_percentage * 0.6) + 
          (LEAST(100, (time_m.total_work_minutes::numeric / 480) * 100) * 0.4), 2
        )
        ELSE 0
      END,
      CASE
        WHEN tm.completed_task_count > 0 AND time_m.total_work_minutes > 0
        THEN ROUND(
          (tm.completed_task_count::numeric / (time_m.total_work_minutes / 60)) * 100, 2
        )
        ELSE 0
      END
    FROM task_metrics tm
    CROSS JOIN time_metrics time_m  
    CROSS JOIN project_breakdown pb;
    
    -- Move to next period
    IF report_granularity = 'weekly' THEN
      current_date_iter := current_date_iter + interval '7 days';
    ELSE
      current_date_iter := current_date_iter + interval '1 day';
    END IF;
  END LOOP;
  
  RETURN;
END;
$function$;

-- 2. Fix get_employee_daily_task_completion - add access control
CREATE OR REPLACE FUNCTION public.get_employee_daily_task_completion(target_user_id uuid, start_date date, end_date date)
RETURNS TABLE(completion_date date, day_name text, total_tasks integer, completed_tasks integer, pending_tasks integer, overdue_tasks integer, completion_rate numeric, total_time_minutes integer, avg_time_per_task numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_date_iter date;
  user_org_id uuid;
BEGIN
  -- Security check: Only allow access to own data or by managers/admins
  SELECT organization_id INTO user_org_id 
  FROM public.users 
  WHERE id = target_user_id;
  
  IF user_org_id IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Check if current user can access this data
  IF target_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND organization_id = user_org_id
    AND role IN ('admin', 'superadmin', 'manager')
  ) THEN
    RAISE EXCEPTION 'Access denied: Can only view your own task completion or you must be a manager/admin';
  END IF;
  
  current_date_iter := start_date;
  
  WHILE current_date_iter <= end_date LOOP
    RETURN QUERY
    WITH daily_tasks AS (
      SELECT
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE t.status = 'Completed') as completed_count,
        COUNT(*) FILTER (WHERE t.status != 'Completed') as pending_count,
        COUNT(*) FILTER (WHERE 
          t.status != 'Completed' AND 
          t.deadline < NOW() AND 
          DATE(t.deadline) < current_date_iter
        ) as overdue_count
      FROM public.tasks t
      WHERE (
        t.user_id = target_user_id::text OR 
        t.assigned_to_id = target_user_id::text OR 
        target_user_id::text = ANY(t.assigned_to_ids)
      )
      AND t.organization_id = user_org_id
      AND (
        DATE(t.deadline) = current_date_iter OR
        (t.deadline IS NULL AND DATE(t.created_at) = current_date_iter)
      )
    ),
    daily_time AS (
      SELECT
        COALESCE(SUM(te.duration_minutes), 0) as total_minutes
      FROM public.time_entries te
      WHERE te.user_id = target_user_id
      AND te.organization_id = user_org_id
      AND DATE(te.clock_in) = current_date_iter
      AND te.clock_out IS NOT NULL
    )
    SELECT
      current_date_iter,
      to_char(current_date_iter, 'Day'),
      COALESCE(dt.total_count, 0),
      COALESCE(dt.completed_count, 0),
      COALESCE(dt.pending_count, 0),
      COALESCE(dt.overdue_count, 0),
      CASE 
        WHEN dt.total_count > 0 
        THEN ROUND((dt.completed_count::numeric / dt.total_count) * 100, 2)
        ELSE 0
      END,
      COALESCE(dtime.total_minutes, 0),
      CASE
        WHEN dt.completed_count > 0 AND dtime.total_minutes > 0
        THEN ROUND(dtime.total_minutes::numeric / dt.completed_count, 2)
        ELSE 0
      END
    FROM daily_tasks dt
    CROSS JOIN daily_time dtime;
    
    current_date_iter := current_date_iter + interval '1 day';
  END LOOP;
  
  RETURN;
END;
$function$;