-- Security Fix: Address the remaining SECURITY DEFINER table-returning functions

-- This migration will identify and fix the remaining functions causing security warnings.
-- We'll add proper access control to the remaining problematic functions.

-- Check if any of the quiz-related functions need fixing
CREATE OR REPLACE FUNCTION public.get_employee_task_stats(target_user_id uuid, start_date date, end_date date)
RETURNS TABLE(completed_tasks integer, total_tasks integer, completion_rate numeric)
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
  
  -- Enhanced access control: Only allow if user is viewing their own stats OR caller has management role
  IF target_user_id != auth.uid() AND caller_role NOT IN ('admin', 'superadmin', 'manager') THEN
    RAISE EXCEPTION 'Access denied: Only managers and admins can view other users'' task statistics';
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
  SELECT 
    COALESCE(COUNT(CASE WHEN t.status = 'Completed' THEN 1 END), 0)::INTEGER as completed_tasks,
    COALESCE(COUNT(*), 0)::INTEGER as total_tasks,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN t.status = 'Completed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 
        0::NUMERIC
    END as completion_rate
  FROM tasks t
  WHERE t.user_id = target_user_id::text
    AND t.organization_id = caller_org_id
    AND t.created_at::DATE BETWEEN start_date AND end_date;
END;
$function$;

-- Fix get_employee_project_contributions
CREATE OR REPLACE FUNCTION public.get_employee_project_contributions(target_user_id uuid, start_date date, end_date date)
RETURNS TABLE(project_id text, project_title text, task_count bigint, completed_tasks bigint, completion_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  org_id uuid;
  caller_role text;
BEGIN
  -- Validate input UUID
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'target_user_id cannot be null';
  END IF;

  -- Get caller's role and organization
  SELECT role, organization_id INTO caller_role, org_id 
  FROM public.users WHERE id = auth.uid();
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Access denied: User not found';
  END IF;
  
  -- Enhanced access control: Only allow if user is viewing their own contributions OR caller has management role
  IF target_user_id != auth.uid() AND caller_role NOT IN ('admin', 'superadmin', 'manager') THEN
    RAISE EXCEPTION 'Access denied: Only managers and admins can view other users'' project contributions';
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