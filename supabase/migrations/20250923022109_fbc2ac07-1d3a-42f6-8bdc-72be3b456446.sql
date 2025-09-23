-- Create RPC function for daily task reports with timezone support
CREATE OR REPLACE FUNCTION rpc_task_report_user_day(
  p_org  uuid,
  p_user uuid,
  p_day  date,
  p_team uuid[] DEFAULT NULL,
  p_tz   text   DEFAULT 'UTC'
)
RETURNS TABLE(
  current_due int,
  overdue int,
  completed int,
  created int,
  assigned int,
  total_due_today int,
  daily_score numeric
) 
LANGUAGE SQL STABLE AS $$
WITH bounds AS (
  SELECT
    (p_day::timestamp AT TIME ZONE p_tz) AT TIME ZONE 'UTC' AS day_start,
    ((p_day + 1)::timestamp AT TIME ZONE p_tz) AT TIME ZONE 'UTC' - INTERVAL '1 microsecond' AS day_end
),
base AS (
  SELECT t.*
  FROM tasks t
  CROSS JOIN bounds b
  WHERE t.organization_id = p_org
    AND (
      t.user_id = p_user::text OR 
      t.assigned_to_id = p_user::text OR 
      p_user::text = ANY(t.assigned_to_ids)
    )
    AND (p_team IS NULL OR t.team_id = ANY(p_team))
    AND t.is_archived = false
)
SELECT
  -- Due today & not completed/archived
  (SELECT count(*)::int FROM base t, bounds b
    WHERE t.deadline >= b.day_start
      AND t.deadline <= b.day_end
      AND t.status NOT IN ('Completed')
  ) AS current_due,
  
  -- Overdue as of end of selected day
  (SELECT count(*)::int FROM base t, bounds b
    WHERE t.deadline < b.day_start
      AND t.status NOT IN ('Completed')
  ) AS overdue,
  
  -- Completed on selected day
  (SELECT count(*)::int FROM base t, bounds b
    WHERE t.completed_at IS NOT NULL
      AND t.completed_at >= b.day_start
      AND t.completed_at <= b.day_end
  ) AS completed,
  
  -- Created on selected day
  (SELECT count(*)::int FROM base t, bounds b
    WHERE t.created_at >= b.day_start
      AND t.created_at <= b.day_end
  ) AS created,
  
  -- Assigned on selected day (approximation using created_at)
  (SELECT count(*)::int FROM base t, bounds b
    WHERE t.created_at >= b.day_start
      AND t.created_at <= b.day_end
      AND t.assignment_type IS NOT NULL
  ) AS assigned,
  
  -- Total due today for score calculation
  (SELECT count(*)::int FROM base t, bounds b
    WHERE t.deadline >= b.day_start
      AND t.deadline <= b.day_end
  ) AS total_due_today,
  
  -- Daily score: completed today / total due today * 100
  CASE
    WHEN (SELECT count(*) FROM base t, bounds b
           WHERE t.deadline >= b.day_start
             AND t.deadline <= b.day_end) = 0
    THEN 100.0
    ELSE ROUND(
      100.0 *
      (SELECT count(*) FROM base t, bounds b
         WHERE t.completed_at IS NOT NULL
           AND t.completed_at >= b.day_start
           AND t.completed_at <= b.day_end
           AND t.deadline >= b.day_start
           AND t.deadline <= b.day_end)::numeric
      /
      GREATEST(1,
        (SELECT count(*) FROM base t, bounds b
           WHERE t.deadline >= b.day_start
             AND t.deadline <= b.day_end)::numeric
      )
    , 1)
  END AS daily_score;
$$;

-- Create RPC function for weekly task reports
CREATE OR REPLACE FUNCTION rpc_task_report_user_week(
  p_org        uuid,
  p_user       uuid,
  p_week_start date,
  p_team       uuid[] DEFAULT NULL,
  p_tz         text   DEFAULT 'UTC'
)
RETURNS TABLE(
  day_date date,
  current_due int,
  overdue int,
  completed int,
  created int,
  assigned int,
  total_due int,
  daily_score numeric
) 
LANGUAGE SQL STABLE AS $$
SELECT
  (p_week_start + day_offset)::date AS day_date,
  r.current_due,
  r.overdue,
  r.completed,
  r.created,
  r.assigned,
  r.total_due_today AS total_due,
  r.daily_score
FROM generate_series(0, 6) AS day_offset
CROSS JOIN LATERAL rpc_task_report_user_day(
  p_org,
  p_user,
  (p_week_start + day_offset)::date,
  p_team,
  p_tz
) AS r;
$$;