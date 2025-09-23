-- PHASE A: Database cleanup and unification

-- A1) Ensure assignment timestamp tracking (idempotent)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

-- helpful indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_at ON public.tasks(assigned_at);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_at_org ON public.tasks(organization_id, assigned_at);

-- Backfill: for existing assigned tasks without assigned_at, set to created_at
UPDATE public.tasks
SET assigned_at = created_at
WHERE assigned_at IS NULL
  AND (assigned_to_id IS NOT NULL
       OR (assigned_to_ids IS NOT NULL AND array_length(assigned_to_ids,1) > 0));

-- A2) Remove ALL legacy/duplicate report RPCs (idempotent)
DO $$
BEGIN
  -- Remove legacy daily functions
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_task_report_user_day') THEN
    DROP FUNCTION IF EXISTS public.rpc_task_report_user_day(text,text,text,text,text) CASCADE;
    DROP FUNCTION IF EXISTS public.rpc_task_report_user_day(uuid,uuid,date,uuid[],text) CASCADE;
    DROP FUNCTION IF EXISTS public.rpc_task_report_user_day(uuid,uuid,text,text) CASCADE;
    DROP FUNCTION IF EXISTS public.rpc_task_report_user_day(uuid,uuid,text) CASCADE;
  END IF;

  -- Remove legacy weekly functions  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_task_report_user_week') THEN
    DROP FUNCTION IF EXISTS public.rpc_task_report_user_week(text,text,text,text,text) CASCADE;
    DROP FUNCTION IF EXISTS public.rpc_task_report_user_week(uuid,uuid,date,uuid[],text) CASCADE;
    DROP FUNCTION IF EXISTS public.rpc_task_report_user_week(uuid,uuid,text,text) CASCADE;
    DROP FUNCTION IF EXISTS public.rpc_task_report_user_week(uuid,uuid,text) CASCADE;
  END IF;

  -- Remove comprehensive report functions
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_comprehensive_employee_report') THEN
    DROP FUNCTION IF EXISTS public.get_comprehensive_employee_report CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_employee_daily_task_completion') THEN
    DROP FUNCTION IF EXISTS public.get_employee_daily_task_completion CASCADE;
  END IF;
END$$;

-- A3) Create the new canonical "LISTS" RPCs (single source of truth)

-- DAILY LISTS
CREATE OR REPLACE FUNCTION public.rpc_task_report_user_day_lists(
  p_org  uuid,
  p_user uuid,
  p_day  date,
  p_team uuid[] DEFAULT NULL,
  p_tz   text   DEFAULT 'UTC'
)
RETURNS TABLE(
  bucket text,              -- 'due_today' | 'overdue' | 'completed_today' | 'created_today' | 'assigned_today'
  task_id uuid,
  title text,
  status text,
  priority text,
  team_id uuid,
  due_at timestamptz,
  created_at timestamptz,
  completed_at timestamptz,
  assigned_at timestamptz
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
WITH bounds AS (
  SELECT
    ((p_day)::timestamp at time zone p_tz) at time zone 'UTC'       AS day_start_utc,
    (((p_day + 1)::timestamp at time zone p_tz) at time zone 'UTC') - interval '1 microsecond' AS day_end_utc
),
base AS (
  SELECT t.*
  FROM public.tasks t
  WHERE t.organization_id = p_org
    AND t.is_archived = false
    AND (
      p_user IS NULL OR
      t.user_id = p_user::text
      OR t.assigned_to_id = p_user::text
      OR (t.assigned_to_ids IS NOT NULL AND p_user::text = ANY(t.assigned_to_ids))
    )
    AND (p_team IS NULL OR t.team_id = ANY(p_team))
),
due_today AS (
  SELECT
    'due_today'::text AS bucket, t.id, t.title, t.status, t.priority, t.team_id,
    t.deadline AS due_at, t.created_at, t.completed_at, t.assigned_at
  FROM base t, bounds b
  WHERE t.deadline >= b.day_start_utc
    AND t.deadline <= b.day_end_utc
    AND t.status NOT IN ('Completed','Archived')
),
overdue AS (
  SELECT
    'overdue'::text AS bucket, t.id, t.title, t.status, t.priority, t.team_id,
    t.deadline AS due_at, t.created_at, t.completed_at, t.assigned_at
  FROM base t, bounds b
  WHERE t.deadline < b.day_start_utc
    AND t.status NOT IN ('Completed','Archived')
),
completed_today AS (
  SELECT
    'completed_today'::text AS bucket, t.id, t.title, t.status, t.priority, t.team_id,
    t.deadline AS due_at, t.created_at, t.completed_at, t.assigned_at
  FROM base t, bounds b
  WHERE t.completed_at IS NOT NULL
    AND t.completed_at >= b.day_start_utc
    AND t.completed_at <= b.day_end_utc
),
created_today AS (
  SELECT
    'created_today'::text AS bucket, t.id, t.title, t.status, t.priority, t.team_id,
    t.deadline AS due_at, t.created_at, t.completed_at, t.assigned_at
  FROM base t, bounds b
  WHERE t.created_at >= b.day_start_utc
    AND t.created_at <= b.day_end_utc
),
assigned_today AS (
  SELECT
    'assigned_today'::text AS bucket, t.id, t.title, t.status, t.priority, t.team_id,
    t.deadline AS due_at, t.created_at, t.completed_at, t.assigned_at
  FROM base t, bounds b
  WHERE t.assigned_at IS NOT NULL
    AND t.assigned_at >= b.day_start_utc
    AND t.assigned_at <= b.day_end_utc
)
SELECT * FROM due_today
UNION ALL
SELECT * FROM overdue
UNION ALL
SELECT * FROM completed_today
UNION ALL
SELECT * FROM created_today
UNION ALL
SELECT * FROM assigned_today;
$$;

-- WEEKLY LISTS (7× daily lists, labeled by day)
CREATE OR REPLACE FUNCTION public.rpc_task_report_user_week_lists(
  p_org        uuid,
  p_user       uuid,
  p_week_start date,
  p_team       uuid[] DEFAULT NULL,
  p_tz         text   DEFAULT 'UTC'
)
RETURNS TABLE(
  day_date date,
  bucket text,
  task_id uuid,
  title text,
  status text,
  priority text,
  team_id uuid,
  due_at timestamptz,
  created_at timestamptz,
  completed_at timestamptz,
  assigned_at timestamptz
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
SELECT
  (p_week_start + i)::date AS day_date,
  l.bucket,
  l.task_id,
  l.title,
  l.status,
  l.priority,
  l.team_id,
  l.due_at,
  l.created_at,
  l.completed_at,
  l.assigned_at
FROM generate_series(0,6) AS i
CROSS JOIN LATERAL public.rpc_task_report_user_day_lists(
  p_org, p_user, (p_week_start + i)::date, p_team, p_tz
) AS l;
$$;