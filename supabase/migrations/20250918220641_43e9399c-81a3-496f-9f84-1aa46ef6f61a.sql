-- Security Fix: Add proper access controls to quiz functions

-- 1. Fix get_quiz_attempts_with_final_scores (single param version)
CREATE OR REPLACE FUNCTION public.get_quiz_attempts_with_final_scores(quiz_id_param uuid)
RETURNS TABLE(id uuid, quiz_id uuid, user_id uuid, attempt_number integer, score integer, max_score integer, passed boolean, answers jsonb, started_at timestamp with time zone, completed_at timestamp with time zone, organization_id uuid, name text, email text, role text, adjusted_score integer, adjusted_passed boolean, has_overrides boolean, override_count integer, total_adjustment integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  quiz_org_id uuid;
BEGIN
  -- Security check: Get quiz organization and verify access
  SELECT q.organization_id INTO quiz_org_id
  FROM public.quizzes q 
  WHERE q.id = quiz_id_param;
  
  IF quiz_org_id IS NULL THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;
  
  -- Only allow managers/admins in the same organization to access quiz attempts
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND organization_id = quiz_org_id
    AND role IN ('admin', 'superadmin', 'manager')
  ) THEN
    RAISE EXCEPTION 'Access denied: Only managers and admins can view quiz attempts';
  END IF;
  
  RETURN QUERY
  SELECT 
    qa.id,
    qa.quiz_id,
    qa.user_id,
    qa.attempt_number,
    qa.score,
    qa.max_score,
    qa.passed,
    qa.answers,
    qa.started_at,
    qa.completed_at,
    qa.organization_id,
    u.name,
    u.email,
    u.role,
    -- Calculate adjusted score
    GREATEST(0, qa.score + COALESCE(overrides_agg.total_adjustment, 0))::integer as adjusted_score,
    -- Calculate adjusted pass status
    CASE 
      WHEN qa.max_score > 0 THEN
        ((GREATEST(0, qa.score + COALESCE(overrides_agg.total_adjustment, 0))::decimal / qa.max_score) * 100) >= COALESCE(q.passing_score, 70)
      ELSE false
    END as adjusted_passed,
    -- Has overrides flag
    COALESCE(overrides_agg.override_count, 0) > 0 as has_overrides,
    -- Override count
    COALESCE(overrides_agg.override_count, 0)::integer as override_count,
    -- Total adjustment
    COALESCE(overrides_agg.total_adjustment, 0)::integer as total_adjustment
  FROM public.quiz_attempts qa
  LEFT JOIN public.users u ON qa.user_id = u.id
  LEFT JOIN public.quizzes q ON qa.quiz_id = q.id
  LEFT JOIN (
    SELECT 
      qao.quiz_attempt_id,
      SUM(qao.override_score - qao.original_score) as total_adjustment,
      COUNT(*) as override_count
    FROM public.quiz_answer_overrides qao
    GROUP BY qao.quiz_attempt_id
  ) overrides_agg ON qa.id = overrides_agg.quiz_attempt_id
  WHERE qa.quiz_id = quiz_id_param
    AND qa.organization_id = quiz_org_id
  ORDER BY qa.started_at DESC;
END;
$function$;

-- 2. Fix get_quiz_attempts_with_final_scores (dual param version)
CREATE OR REPLACE FUNCTION public.get_quiz_attempts_with_final_scores(quiz_id_param uuid, organization_id_param uuid)
RETURNS TABLE(id uuid, quiz_id uuid, user_id uuid, attempt_number integer, original_score integer, final_score integer, original_passed boolean, final_passed boolean, max_score integer, total_adjustment integer, override_count integer, answers jsonb, started_at timestamp with time zone, completed_at timestamp with time zone, organization_id uuid, has_overrides boolean, name text, email text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Security check: Only allow managers/admins in the same organization to access quiz attempts
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND organization_id = organization_id_param
    AND role IN ('admin', 'superadmin', 'manager')
  ) THEN
    RAISE EXCEPTION 'Access denied: Only managers and admins can view quiz attempts';
  END IF;
  
  -- Verify quiz belongs to the organization
  IF NOT EXISTS (
    SELECT 1 FROM public.quizzes 
    WHERE id = quiz_id_param 
    AND organization_id = organization_id_param
  ) THEN
    RAISE EXCEPTION 'Quiz not found in the specified organization';
  END IF;
  
  RETURN QUERY
  SELECT 
    qa.id,
    qa.quiz_id,
    qa.user_id,
    qa.attempt_number,
    qa.score as original_score,
    -- Use the calculate function for final score, with fallback
    COALESCE(
      (public.calculate_quiz_attempt_final_score(qa.id)->>'final_score')::integer, 
      qa.score
    ) as final_score,
    qa.passed as original_passed,
    -- Use the calculate function for final passed status, with fallback
    COALESCE(
      (public.calculate_quiz_attempt_final_score(qa.id)->>'final_passed')::boolean, 
      qa.passed
    ) as final_passed,
    qa.max_score,
    -- Use the calculate function for total adjustment, with fallback
    COALESCE(
      (public.calculate_quiz_attempt_final_score(qa.id)->>'total_adjustment')::integer, 
      0
    ) as total_adjustment,
    -- Use the calculate function for override count, with fallback
    COALESCE(
      (public.calculate_quiz_attempt_final_score(qa.id)->>'override_count')::integer, 
      0
    ) as override_count,
    qa.answers,
    qa.started_at,
    qa.completed_at,
    qa.organization_id,
    -- Determine if has overrides based on override count
    COALESCE(
      (public.calculate_quiz_attempt_final_score(qa.id)->>'override_count')::integer, 
      0
    ) > 0 as has_overrides,
    -- Join user data
    u.name,
    u.email,
    u.role
  FROM public.quiz_attempts qa
  LEFT JOIN public.users u ON qa.user_id = u.id
  WHERE qa.quiz_id = quiz_id_param
    AND qa.organization_id = organization_id_param
  ORDER BY qa.started_at DESC;
END;
$function$;