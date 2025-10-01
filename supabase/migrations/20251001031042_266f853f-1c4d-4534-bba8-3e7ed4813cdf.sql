-- RPC function for daily checklist scores
CREATE OR REPLACE FUNCTION public.rpc_checklist_report_daily_scores(
  p_org uuid,
  p_team uuid DEFAULT NULL,
  p_date date DEFAULT CURRENT_DATE,
  p_tz text DEFAULT 'UTC'
)
RETURNS TABLE (
  team_id uuid,
  team_name text,
  user_id uuid,
  user_name text,
  total_checklists bigint,
  completed_checklists bigint,
  pending_checklists bigint,
  submitted_checklists bigint,
  approved_checklists bigint,
  rejected_checklists bigint,
  execution_score numeric,
  verification_score numeric,
  avg_execution_score numeric,
  avg_verification_score numeric,
  completion_rate numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id as team_id,
    t.name as team_name,
    u.id as user_id,
    u.name as user_name,
    COUNT(ci.id) as total_checklists,
    COUNT(ci.id) FILTER (WHERE ci.status = 'approved') as completed_checklists,
    COUNT(ci.id) FILTER (WHERE ci.status = 'pending') as pending_checklists,
    COUNT(ci.id) FILTER (WHERE ci.status = 'submitted') as submitted_checklists,
    COUNT(ci.id) FILTER (WHERE ci.status = 'approved') as approved_checklists,
    COUNT(ci.id) FILTER (WHERE ci.status = 'rejected') as rejected_checklists,
    COALESCE(SUM(
      (SELECT COUNT(*) FILTER (WHERE executed_status IN ('pass', 'na'))::numeric / NULLIF(COUNT(*), 0) * 100
       FROM checklist_item_entries_v2 
       WHERE instance_id = ci.id)
    ) / NULLIF(COUNT(ci.id), 0), 0) as execution_score,
    COALESCE(SUM(
      (SELECT COUNT(*) FILTER (WHERE verified_status IN ('pass', 'na'))::numeric / NULLIF(COUNT(*), 0) * 100
       FROM checklist_item_entries_v2 
       WHERE instance_id = ci.id)
    ) / NULLIF(COUNT(ci.id), 0), 0) as verification_score,
    COALESCE(AVG(
      (SELECT COUNT(*) FILTER (WHERE executed_status IN ('pass', 'na'))::numeric / NULLIF(COUNT(*), 0) * 100
       FROM checklist_item_entries_v2 
       WHERE instance_id = ci.id)
    ), 0) as avg_execution_score,
    COALESCE(AVG(
      (SELECT COUNT(*) FILTER (WHERE verified_status IN ('pass', 'na'))::numeric / NULLIF(COUNT(*), 0) * 100
       FROM checklist_item_entries_v2 
       WHERE instance_id = ci.id)
    ), 0) as avg_verification_score,
    COALESCE(COUNT(ci.id) FILTER (WHERE ci.status = 'approved')::numeric / NULLIF(COUNT(ci.id), 0) * 100, 0) as completion_rate
  FROM checklist_instances_v2 ci
  LEFT JOIN checklist_templates_v2 ct ON ci.template_id = ct.id
  LEFT JOIN teams t ON ci.team_id = t.id
  LEFT JOIN users u ON ci.executed_by = u.id
  WHERE ci.org_id = p_org
    AND ci.date = p_date
    AND (p_team IS NULL OR ci.team_id = p_team)
  GROUP BY t.id, t.name, u.id, u.name
  ORDER BY team_name, user_name;
END;
$$;

-- RPC function for weekly checklist summary
CREATE OR REPLACE FUNCTION public.rpc_checklist_report_weekly_summary(
  p_org uuid,
  p_team uuid DEFAULT NULL,
  p_week_start date DEFAULT DATE_TRUNC('week', CURRENT_DATE)::date,
  p_tz text DEFAULT 'UTC'
)
RETURNS TABLE (
  week_start date,
  team_id uuid,
  team_name text,
  total_checklists bigint,
  completed_checklists bigint,
  pending_checklists bigint,
  approved_checklists bigint,
  rejected_checklists bigint,
  avg_execution_score numeric,
  avg_verification_score numeric,
  completion_rate numeric,
  on_time_rate numeric,
  daily_breakdown jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_week_start as week_start,
    t.id as team_id,
    t.name as team_name,
    COUNT(ci.id) as total_checklists,
    COUNT(ci.id) FILTER (WHERE ci.status IN ('approved', 'submitted')) as completed_checklists,
    COUNT(ci.id) FILTER (WHERE ci.status = 'pending') as pending_checklists,
    COUNT(ci.id) FILTER (WHERE ci.status = 'approved') as approved_checklists,
    COUNT(ci.id) FILTER (WHERE ci.status = 'rejected') as rejected_checklists,
    COALESCE(AVG(
      (SELECT COUNT(*) FILTER (WHERE executed_status IN ('pass', 'na'))::numeric / NULLIF(COUNT(*), 0) * 100
       FROM checklist_item_entries_v2 
       WHERE instance_id = ci.id)
    ), 0) as avg_execution_score,
    COALESCE(AVG(
      (SELECT COUNT(*) FILTER (WHERE verified_status IN ('pass', 'na'))::numeric / NULLIF(COUNT(*), 0) * 100
       FROM checklist_item_entries_v2 
       WHERE instance_id = ci.id)
    ), 0) as avg_verification_score,
    COALESCE(COUNT(ci.id) FILTER (WHERE ci.status = 'approved')::numeric / NULLIF(COUNT(ci.id), 0) * 100, 0) as completion_rate,
    COALESCE(COUNT(ci.id) FILTER (WHERE ci.executed_at IS NOT NULL AND ci.executed_at <= ci.scheduled_end)::numeric / NULLIF(COUNT(ci.id) FILTER (WHERE ci.executed_at IS NOT NULL), 0) * 100, 0) as on_time_rate,
    jsonb_agg(
      jsonb_build_object(
        'date', ci.date,
        'completed', COUNT(*) FILTER (WHERE ci.status = 'approved'),
        'pending', COUNT(*) FILTER (WHERE ci.status = 'pending'),
        'execution_score', COALESCE(AVG(
          (SELECT COUNT(*) FILTER (WHERE executed_status IN ('pass', 'na'))::numeric / NULLIF(COUNT(*), 0) * 100
           FROM checklist_item_entries_v2 
           WHERE instance_id = ci.id)
        ), 0)
      )
    ) as daily_breakdown
  FROM checklist_instances_v2 ci
  LEFT JOIN teams t ON ci.team_id = t.id
  WHERE ci.org_id = p_org
    AND ci.date >= p_week_start
    AND ci.date < p_week_start + INTERVAL '7 days'
    AND (p_team IS NULL OR ci.team_id = p_team)
  GROUP BY t.id, t.name
  ORDER BY team_name;
END;
$$;

-- RPC function for team comparison
CREATE OR REPLACE FUNCTION public.rpc_checklist_report_team_comparison(
  p_org uuid,
  p_week_start date DEFAULT DATE_TRUNC('week', CURRENT_DATE)::date,
  p_tz text DEFAULT 'UTC'
)
RETURNS TABLE (
  team_id uuid,
  team_name text,
  total_score numeric,
  execution_score numeric,
  verification_score numeric,
  completion_rate numeric,
  on_time_rate numeric,
  team_rank integer,
  week_over_week_change numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH current_week AS (
    SELECT
      t.id as team_id,
      t.name as team_name,
      COALESCE(AVG(
        (SELECT COUNT(*) FILTER (WHERE executed_status IN ('pass', 'na'))::numeric / NULLIF(COUNT(*), 0) * 100
         FROM checklist_item_entries_v2 
         WHERE instance_id = ci.id)
      ), 0) as execution_score,
      COALESCE(AVG(
        (SELECT COUNT(*) FILTER (WHERE verified_status IN ('pass', 'na'))::numeric / NULLIF(COUNT(*), 0) * 100
         FROM checklist_item_entries_v2 
         WHERE instance_id = ci.id)
      ), 0) as verification_score,
      COALESCE(COUNT(ci.id) FILTER (WHERE ci.status = 'approved')::numeric / NULLIF(COUNT(ci.id), 0) * 100, 0) as completion_rate,
      COALESCE(COUNT(ci.id) FILTER (WHERE ci.executed_at IS NOT NULL AND ci.executed_at <= ci.scheduled_end)::numeric / NULLIF(COUNT(ci.id) FILTER (WHERE ci.executed_at IS NOT NULL), 0) * 100, 0) as on_time_rate
    FROM checklist_instances_v2 ci
    LEFT JOIN teams t ON ci.team_id = t.id
    WHERE ci.org_id = p_org
      AND ci.date >= p_week_start
      AND ci.date < p_week_start + INTERVAL '7 days'
    GROUP BY t.id, t.name
  ),
  previous_week AS (
    SELECT
      t.id as team_id,
      COALESCE((
        AVG(
          (SELECT COUNT(*) FILTER (WHERE executed_status IN ('pass', 'na'))::numeric / NULLIF(COUNT(*), 0) * 100
           FROM checklist_item_entries_v2 
           WHERE instance_id = ci.id)
        ) * 0.4 +
        AVG(
          (SELECT COUNT(*) FILTER (WHERE verified_status IN ('pass', 'na'))::numeric / NULLIF(COUNT(*), 0) * 100
           FROM checklist_item_entries_v2 
           WHERE instance_id = ci.id)
        ) * 0.3 +
        COUNT(ci.id) FILTER (WHERE ci.status = 'approved')::numeric / NULLIF(COUNT(ci.id), 0) * 100 * 0.3
      ), 0) as total_score
    FROM checklist_instances_v2 ci
    LEFT JOIN teams t ON ci.team_id = t.id
    WHERE ci.org_id = p_org
      AND ci.date >= p_week_start - INTERVAL '7 days'
      AND ci.date < p_week_start
    GROUP BY t.id
  )
  SELECT
    cw.team_id,
    cw.team_name,
    COALESCE((cw.execution_score * 0.4 + cw.verification_score * 0.3 + cw.completion_rate * 0.3), 0) as total_score,
    cw.execution_score,
    cw.verification_score,
    cw.completion_rate,
    cw.on_time_rate,
    RANK() OVER (ORDER BY (cw.execution_score * 0.4 + cw.verification_score * 0.3 + cw.completion_rate * 0.3) DESC)::integer as team_rank,
    COALESCE((cw.execution_score * 0.4 + cw.verification_score * 0.3 + cw.completion_rate * 0.3) - pw.total_score, 0) as week_over_week_change
  FROM current_week cw
  LEFT JOIN previous_week pw ON cw.team_id = pw.team_id
  ORDER BY total_score DESC;
END;
$$;