-- Phase 1: Fix Database Function Conflicts and Issues

-- Drop the conflicting function to start fresh
DROP FUNCTION IF EXISTS public.get_quiz_attempts_with_final_scores(uuid, uuid);

-- Recreate the function with proper type handling and error checking
CREATE OR REPLACE FUNCTION public.get_quiz_attempts_with_final_scores(quiz_id_param uuid, organization_id_param uuid)
RETURNS TABLE (
  id uuid,
  quiz_id uuid,
  user_id uuid,
  attempt_number integer,
  original_score integer,
  final_score integer,
  original_passed boolean,
  final_passed boolean,
  max_score integer,
  total_adjustment integer,
  override_count integer,
  answers jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  organization_id uuid,
  has_overrides boolean,
  name text,
  email text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- Improve the calculate_quiz_attempt_final_score function to handle edge cases
CREATE OR REPLACE FUNCTION public.calculate_quiz_attempt_final_score(attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_record RECORD;
  total_adjustment integer := 0;
  final_score integer;
  max_score integer;
  pass_threshold integer;
  final_passed boolean;
  override_count integer := 0;
  final_percentage numeric;
BEGIN
  -- Get attempt details with error handling
  SELECT * INTO attempt_record
  FROM public.quiz_attempts 
  WHERE id = attempt_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'error', 'Quiz attempt not found',
      'attempt_id', attempt_id,
      'original_score', 0,
      'final_score', 0,
      'max_score', 0,
      'total_adjustment', 0,
      'override_count', 0,
      'original_passed', false,
      'final_passed', false,
      'pass_threshold', 70,
      'final_percentage', 0
    );
  END IF;
  
  -- Get quiz passing score with fallback
  SELECT passing_score INTO pass_threshold
  FROM public.quizzes
  WHERE id = attempt_record.quiz_id;
  
  pass_threshold := COALESCE(pass_threshold, 70);
  
  -- Calculate total override adjustments with proper error handling
  SELECT 
    COALESCE(SUM(override_score - original_score), 0)::integer,
    COUNT(*)::integer
  INTO total_adjustment, override_count
  FROM public.quiz_answer_overrides
  WHERE quiz_attempt_id = attempt_id;
  
  -- Ensure we have valid values even if query returns NULL
  total_adjustment := COALESCE(total_adjustment, 0);
  override_count := COALESCE(override_count, 0);
  
  -- Calculate final score (ensure it's not negative)
  final_score := GREATEST(0, COALESCE(attempt_record.score, 0) + total_adjustment);
  max_score := COALESCE(attempt_record.max_score, 0);
  
  -- Calculate final percentage
  final_percentage := CASE 
    WHEN max_score > 0 THEN ROUND((final_score::decimal / max_score * 100)::numeric, 2)
    ELSE 0
  END;
  
  -- Determine if passed based on final score
  final_passed := CASE 
    WHEN max_score > 0 THEN final_percentage >= pass_threshold
    ELSE false
  END;
  
  -- Return comprehensive result with all required fields
  RETURN jsonb_build_object(
    'attempt_id', attempt_id,
    'original_score', COALESCE(attempt_record.score, 0),
    'final_score', final_score,
    'max_score', max_score,
    'total_adjustment', total_adjustment,
    'override_count', override_count,
    'original_passed', COALESCE(attempt_record.passed, false),
    'final_passed', final_passed,
    'pass_threshold', pass_threshold,
    'final_percentage', final_percentage
  );
END;
$$;