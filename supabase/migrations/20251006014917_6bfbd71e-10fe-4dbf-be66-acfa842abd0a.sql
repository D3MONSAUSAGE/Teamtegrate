-- Employee Task Performance Score RPC
CREATE OR REPLACE FUNCTION public.rpc_employee_task_performance(
  p_org UUID,
  p_user UUID,
  p_start DATE,
  p_end DATE,
  p_tz TEXT
)
RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  total_tasks BIGINT,
  completed_tasks BIGINT,
  completed_on_time BIGINT,
  overdue_tasks BIGINT,
  completion_rate NUMERIC,
  velocity NUMERIC,
  quality_score NUMERIC,
  consistency_score NUMERIC,
  total_score NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days_in_period NUMERIC;
  daily_completions NUMERIC[];
  std_dev NUMERIC;
BEGIN
  days_in_period := (p_end - p_start) + 1;
  
  RETURN QUERY
  WITH task_stats AS (
    SELECT
      u.id,
      u.name,
      u.email,
      COUNT(t.id) as total,
      COUNT(CASE WHEN t.status = 'Completed' THEN 1 END) as completed,
      COUNT(CASE 
        WHEN t.status = 'Completed' 
        AND t.completed_at IS NOT NULL 
        AND t.deadline IS NOT NULL
        AND (t.completed_at AT TIME ZONE p_tz)::DATE <= (t.deadline AT TIME ZONE p_tz)::DATE
        THEN 1 
      END) as on_time,
      COUNT(CASE 
        WHEN t.status != 'Completed' 
        AND t.deadline IS NOT NULL 
        AND (t.deadline AT TIME ZONE p_tz)::DATE < CURRENT_DATE
        THEN 1 
      END) as overdue,
      ARRAY_AGG(
        (SELECT COUNT(*) FROM tasks t2 
         WHERE (t2.assigned_to_id = u.id::TEXT OR u.id::TEXT = ANY(t2.assigned_to_ids))
         AND t2.status = 'Completed'
         AND t2.organization_id = p_org
         AND (t2.completed_at AT TIME ZONE p_tz)::DATE = d.day
        )
      ) as daily_counts
    FROM users u
    CROSS JOIN GENERATE_SERIES(p_start, p_end, '1 day'::INTERVAL) d(day)
    LEFT JOIN tasks t ON (
      (t.assigned_to_id = u.id::TEXT OR u.id::TEXT = ANY(t.assigned_to_ids))
      AND t.organization_id = p_org
      AND (
        (t.created_at AT TIME ZONE p_tz)::DATE BETWEEN p_start AND p_end
        OR (t.deadline AT TIME ZONE p_tz)::DATE BETWEEN p_start AND p_end
        OR (t.completed_at AT TIME ZONE p_tz)::DATE BETWEEN p_start AND p_end
      )
      AND t.is_archived = FALSE
    )
    WHERE u.id = p_user
    AND u.organization_id = p_org
    GROUP BY u.id, u.name, u.email
  )
  SELECT
    ts.id,
    ts.name,
    ts.email,
    ts.total,
    ts.completed,
    ts.on_time,
    ts.overdue,
    CASE WHEN ts.total > 0 
      THEN ROUND((ts.completed::NUMERIC / ts.total::NUMERIC) * 100, 2)
      ELSE 0 
    END as completion_rate,
    ROUND(ts.completed::NUMERIC / days_in_period, 2) as velocity,
    CASE WHEN ts.completed > 0
      THEN ROUND((ts.on_time::NUMERIC / ts.completed::NUMERIC) * 100, 2)
      ELSE 100
    END as quality_score,
    CASE 
      WHEN ARRAY_LENGTH(ts.daily_counts, 1) > 1 THEN
        ROUND(100 - LEAST(STDDEV_POP((SELECT UNNEST(ts.daily_counts))) * 10, 100), 2)
      ELSE 100
    END as consistency_score,
    ROUND((
      (CASE WHEN ts.total > 0 THEN (ts.completed::NUMERIC / ts.total::NUMERIC) ELSE 0 END * 0.40) +
      ((ts.completed::NUMERIC / days_in_period) / GREATEST(days_in_period / 7, 1) * 0.20) +
      (CASE WHEN ts.completed > 0 THEN (ts.on_time::NUMERIC / ts.completed::NUMERIC) ELSE 1 END * 0.20) +
      (CASE 
        WHEN ARRAY_LENGTH(ts.daily_counts, 1) > 1 THEN
          (1 - LEAST(STDDEV_POP((SELECT UNNEST(ts.daily_counts))) / GREATEST(AVG((SELECT UNNEST(ts.daily_counts))), 1), 1))
        ELSE 1
      END * 0.20)
    ) * 100, 2) as total_score
  FROM task_stats ts;
END;
$$;

-- Team Task Performance Score RPC
CREATE OR REPLACE FUNCTION public.rpc_team_task_performance(
  p_org UUID,
  p_team UUID[],
  p_start DATE,
  p_end DATE,
  p_tz TEXT
)
RETURNS TABLE(
  team_id UUID,
  team_name TEXT,
  member_count BIGINT,
  total_tasks BIGINT,
  completed_tasks BIGINT,
  avg_completion_rate NUMERIC,
  team_velocity NUMERIC,
  workload_balance_score NUMERIC,
  collaboration_score NUMERIC,
  team_score NUMERIC,
  top_performer_id UUID,
  top_performer_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days_in_period NUMERIC;
BEGIN
  days_in_period := (p_end - p_start) + 1;
  
  RETURN QUERY
  WITH team_members AS (
    SELECT DISTINCT
      t.id as team_id,
      t.name as team_name,
      tm.user_id,
      u.name as user_name
    FROM teams t
    JOIN team_memberships tm ON tm.team_id = t.id
    JOIN users u ON u.id = tm.user_id
    WHERE t.organization_id = p_org
    AND (p_team IS NULL OR t.id = ANY(p_team))
  ),
  member_stats AS (
    SELECT
      tm.team_id,
      tm.user_id,
      tm.user_name,
      COUNT(tk.id) as tasks,
      COUNT(CASE WHEN tk.status = 'Completed' THEN 1 END) as completed,
      CASE WHEN COUNT(tk.id) > 0 
        THEN (COUNT(CASE WHEN tk.status = 'Completed' THEN 1 END)::NUMERIC / COUNT(tk.id)::NUMERIC)
        ELSE 0 
      END as completion_rate
    FROM team_members tm
    LEFT JOIN tasks tk ON (
      (tk.assigned_to_id = tm.user_id::TEXT OR tm.user_id::TEXT = ANY(tk.assigned_to_ids))
      AND tk.organization_id = p_org
      AND (
        (tk.created_at AT TIME ZONE p_tz)::DATE BETWEEN p_start AND p_end
        OR (tk.deadline AT TIME ZONE p_tz)::DATE BETWEEN p_start AND p_end
        OR (tk.completed_at AT TIME ZONE p_tz)::DATE BETWEEN p_start AND p_end
      )
      AND tk.is_archived = FALSE
    )
    GROUP BY tm.team_id, tm.user_id, tm.user_name
  ),
  team_stats AS (
    SELECT
      ms.team_id,
      COUNT(DISTINCT ms.user_id) as members,
      SUM(ms.tasks) as total_tasks,
      SUM(ms.completed) as total_completed,
      AVG(ms.completion_rate) as avg_comp_rate,
      STDDEV_POP(ms.tasks) / NULLIF(AVG(ms.tasks), 0) as workload_cv,
      COUNT(CASE WHEN ms.tasks > 0 THEN 1 END)::NUMERIC / NULLIF(COUNT(DISTINCT ms.user_id), 0) as active_ratio
    FROM member_stats ms
    GROUP BY ms.team_id
  ),
  multi_assigned AS (
    SELECT
      tm.team_id,
      COUNT(DISTINCT tk.id) as collab_tasks
    FROM team_members tm
    JOIN tasks tk ON (tm.user_id::TEXT = ANY(tk.assigned_to_ids))
    WHERE tk.organization_id = p_org
    AND ARRAY_LENGTH(tk.assigned_to_ids, 1) > 1
    AND (
      (tk.created_at AT TIME ZONE p_tz)::DATE BETWEEN p_start AND p_end
      OR (tk.deadline AT TIME ZONE p_tz)::DATE BETWEEN p_start AND p_end
    )
    AND tk.is_archived = FALSE
    GROUP BY tm.team_id
  ),
  top_performers AS (
    SELECT DISTINCT ON (ms.team_id)
      ms.team_id,
      ms.user_id,
      ms.user_name,
      ms.completion_rate
    FROM member_stats ms
    WHERE ms.tasks > 0
    ORDER BY ms.team_id, ms.completion_rate DESC, ms.completed DESC
  )
  SELECT
    tm.team_id,
    tm.team_name,
    ts.members,
    ts.total_tasks,
    ts.total_completed,
    ROUND(ts.avg_comp_rate * 100, 2),
    ROUND(ts.total_completed::NUMERIC / days_in_period, 2),
    ROUND((1 - COALESCE(ts.workload_cv, 0)) * 100, 2),
    ROUND(COALESCE(ma.collab_tasks::NUMERIC / NULLIF(ts.total_tasks, 0), 0) * 100, 2),
    ROUND((
      (ts.avg_comp_rate * 0.30) +
      ((ts.total_completed::NUMERIC / days_in_period) / GREATEST(days_in_period / 7, 1) * 0.25) +
      ((1 - COALESCE(ts.workload_cv, 0)) * 0.25) +
      (COALESCE(ma.collab_tasks::NUMERIC / NULLIF(ts.total_tasks, 0), 0) * 0.20)
    ) * 100, 2),
    tp.user_id,
    tp.user_name
  FROM team_members tm
  JOIN team_stats ts ON ts.team_id = tm.team_id
  LEFT JOIN multi_assigned ma ON ma.team_id = tm.team_id
  LEFT JOIN top_performers tp ON tp.team_id = tm.team_id
  GROUP BY tm.team_id, tm.team_name, ts.members, ts.total_tasks, ts.total_completed, 
           ts.avg_comp_rate, ts.workload_cv, ts.active_ratio, ma.collab_tasks, 
           tp.user_id, tp.user_name, days_in_period;
END;
$$;

-- Organization Leaderboard RPC
CREATE OR REPLACE FUNCTION public.rpc_org_task_leaderboard(
  p_org UUID,
  p_start DATE,
  p_end DATE,
  p_tz TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  rank BIGINT,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  team_name TEXT,
  total_score NUMERIC,
  completed_tasks BIGINT,
  completion_rate NUMERIC,
  badges TEXT[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_scores AS (
    SELECT
      u.id,
      u.name,
      u.email,
      t.name as team,
      COUNT(CASE WHEN tk.status = 'Completed' THEN 1 END) as completed,
      COUNT(tk.id) as total,
      CASE WHEN COUNT(tk.id) > 0 
        THEN (COUNT(CASE WHEN tk.status = 'Completed' THEN 1 END)::NUMERIC / COUNT(tk.id)::NUMERIC * 100)
        ELSE 0 
      END as comp_rate,
      ROUND((
        (CASE WHEN COUNT(tk.id) > 0 THEN (COUNT(CASE WHEN tk.status = 'Completed' THEN 1 END)::NUMERIC / COUNT(tk.id)::NUMERIC) ELSE 0 END * 0.40) +
        ((COUNT(CASE WHEN tk.status = 'Completed' THEN 1 END)::NUMERIC / ((p_end - p_start) + 1)) / GREATEST(((p_end - p_start) + 1) / 7, 1) * 0.20) +
        (0.40)
      ) * 100, 2) as score
    FROM users u
    LEFT JOIN team_memberships tm ON tm.user_id = u.id
    LEFT JOIN teams t ON t.id = tm.team_id
    LEFT JOIN tasks tk ON (
      (tk.assigned_to_id = u.id::TEXT OR u.id::TEXT = ANY(tk.assigned_to_ids))
      AND tk.organization_id = p_org
      AND (
        (tk.created_at AT TIME ZONE p_tz)::DATE BETWEEN p_start AND p_end
        OR (tk.deadline AT TIME ZONE p_tz)::DATE BETWEEN p_start AND p_end
        OR (tk.completed_at AT TIME ZONE p_tz)::DATE BETWEEN p_start AND p_end
      )
      AND tk.is_archived = FALSE
    )
    WHERE u.organization_id = p_org
    GROUP BY u.id, u.name, u.email, t.name
    HAVING COUNT(tk.id) > 0
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY us.score DESC, us.completed DESC) as rank,
    us.id,
    us.name,
    us.email,
    us.team,
    us.score,
    us.completed,
    us.comp_rate,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN us.score >= 90 THEN 'Top Performer' END,
      CASE WHEN us.comp_rate >= 95 THEN 'Quality Master' END,
      CASE WHEN us.completed >= 20 THEN 'High Volume' END,
      CASE WHEN us.score >= 80 THEN 'Consistent' END
    ], NULL) as badges
  FROM user_scores us
  ORDER BY us.score DESC, us.completed DESC
  LIMIT p_limit;
END;
$$;