-- Security Fix: Final cleanup of SECURITY DEFINER table-returning functions

-- Fix quiz-related functions that don't have proper access controls
CREATE OR REPLACE FUNCTION public.get_quiz_attempts_with_final_scores(quiz_id_param uuid)
RETURNS TABLE(id uuid, quiz_id uuid, user_id uuid, attempt_number integer, score integer, max_score integer, passed boolean, answers jsonb, started_at timestamp with time zone, completed_at timestamp with time zone, organization_id uuid, name text, email text, role text, adjusted_score integer, adjusted_passed boolean, has_overrides boolean, override_count integer, total_adjustment integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only allow admins and managers to view quiz attempts
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'manager')
    AND organization_id = get_current_user_organization_id()
  ) THEN
    RAISE EXCEPTION 'Access denied: Only managers and admins can view quiz attempts';
  END IF;
  
  -- Verify quiz belongs to user's organization
  IF NOT EXISTS (
    SELECT 1 FROM public.quizzes 
    WHERE id = quiz_id_param 
    AND organization_id = get_current_user_organization_id()
  ) THEN
    RAISE EXCEPTION 'Access denied: Quiz not found in your organization';
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
    GREATEST(0, qa.score + COALESCE(overrides_agg.total_adjustment, 0))::integer as adjusted_score,
    CASE 
      WHEN qa.max_score > 0 THEN
        ((GREATEST(0, qa.score + COALESCE(overrides_agg.total_adjustment, 0))::decimal / qa.max_score) * 100) >= COALESCE(q.passing_score, 70)
      ELSE false
    END as adjusted_passed,
    COALESCE(overrides_agg.override_count, 0) > 0 as has_overrides,
    COALESCE(overrides_agg.override_count, 0)::integer as override_count,
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
  AND qa.organization_id = get_current_user_organization_id()
  ORDER BY qa.started_at DESC;
END;
$function$;

-- Fix the overloaded version with organization parameter
CREATE OR REPLACE FUNCTION public.get_quiz_attempts_with_final_scores(quiz_id_param uuid, organization_id_param uuid)
RETURNS TABLE(id uuid, quiz_id uuid, user_id uuid, attempt_number integer, original_score integer, final_score integer, original_passed boolean, final_passed boolean, max_score integer, total_adjustment integer, override_count integer, answers jsonb, started_at timestamp with time zone, completed_at timestamp with time zone, organization_id uuid, has_overrides boolean, name text, email text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only allow admins and managers to view quiz attempts
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'manager')
    AND organization_id = organization_id_param
  ) THEN
    RAISE EXCEPTION 'Access denied: Only managers and admins can view quiz attempts';
  END IF;
  
  -- Verify organization matches user's organization
  IF organization_id_param != get_current_user_organization_id() THEN
    RAISE EXCEPTION 'Access denied: Cannot access data from different organization';
  END IF;

  RETURN QUERY
  SELECT 
    qa.id,
    qa.quiz_id,
    qa.user_id,
    qa.attempt_number,
    qa.score as original_score,
    COALESCE(
      (public.calculate_quiz_attempt_final_score(qa.id)->>'final_score')::integer, 
      qa.score
    ) as final_score,
    qa.passed as original_passed,
    COALESCE(
      (public.calculate_quiz_attempt_final_score(qa.id)->>'final_passed')::boolean, 
      qa.passed
    ) as final_passed,
    qa.max_score,
    COALESCE(
      (public.calculate_quiz_attempt_final_score(qa.id)->>'total_adjustment')::integer, 
      0
    ) as total_adjustment,
    COALESCE(
      (public.calculate_quiz_attempt_final_score(qa.id)->>'override_count')::integer, 
      0
    ) as override_count,
    qa.answers,
    qa.started_at,
    qa.completed_at,
    qa.organization_id,
    COALESCE(
      (public.calculate_quiz_attempt_final_score(qa.id)->>'override_count')::integer, 
      0
    ) > 0 as has_overrides,
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