-- Drop and recreate the function to fix ambiguous column references
DROP FUNCTION IF EXISTS public.get_employee_project_contributions(uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_employee_project_contributions(target_user_id uuid, start_date date, end_date date)
RETURNS TABLE(
  project_id text,
  project_title text,
  task_count bigint,
  completed_tasks bigint,
  completion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org_id uuid;
BEGIN
  -- Validate input UUID
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'target_user_id cannot be null';
  END IF;

  -- Get user's organization and validate access
  SELECT organization_id INTO org_id FROM public.users WHERE id = target_user_id;
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Target user not found or invalid';
  END IF;
  
  -- Check if current user can access this data
  IF org_id != get_current_user_organization_id() THEN
    RAISE EXCEPTION 'Access denied: Target user is not in your organization';
  END IF;

  RETURN QUERY
  SELECT 
    t.project_id,
    COALESCE(p.title, 'No Project') as project_title,
    COUNT(*) as task_count,
    COUNT(*) FILTER (WHERE t.status = 'Completed') as completed_tasks,
    CASE 
      WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE t.status = 'Completed')::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0::numeric
    END as completion_rate
  FROM public.tasks t
  LEFT JOIN public.projects p ON t.project_id = p.id
  WHERE (
    t.user_id = target_user_id::text OR 
    t.assigned_to_id = target_user_id::text OR 
    target_user_id::text = ANY(t.assigned_to_ids)
  )
  AND t.organization_id = org_id
  AND DATE(t.created_at) BETWEEN get_employee_project_contributions.start_date AND get_employee_project_contributions.end_date
  GROUP BY t.project_id, p.title
  ORDER BY task_count DESC;
END;
$function$;