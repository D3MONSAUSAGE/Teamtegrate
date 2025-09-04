-- Fix database function type mismatches and improve efficiency
DROP FUNCTION IF EXISTS get_quiz_attempts_with_final_scores(uuid);

CREATE OR REPLACE FUNCTION get_quiz_attempts_with_final_scores(quiz_id_param uuid)
RETURNS TABLE (
  id uuid,
  quiz_id uuid,
  user_id uuid,
  attempt_number integer,
  score integer,
  max_score integer,
  passed boolean,
  answers jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  organization_id uuid,
  name text,
  email text,
  role text,
  adjusted_score integer,
  adjusted_passed boolean,
  has_overrides boolean,
  override_count integer,
  total_adjustment integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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
  ORDER BY qa.started_at DESC;
END;
$$;

-- Update the calculate_quiz_attempt_final_score function to return proper types
DROP FUNCTION IF EXISTS calculate_quiz_attempt_final_score(uuid);

CREATE OR REPLACE FUNCTION calculate_quiz_attempt_final_score(attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_record RECORD;
  total_adjustment integer := 0;
  final_score integer;
  max_score integer;
  pass_threshold integer;
  final_passed boolean;
  override_count integer := 0;
BEGIN
  -- Get attempt details
  SELECT * INTO attempt_record
  FROM public.quiz_attempts 
  WHERE id = attempt_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quiz attempt not found');
  END IF;
  
  -- Get quiz passing score
  SELECT passing_score INTO pass_threshold
  FROM public.quizzes
  WHERE id = attempt_record.quiz_id;
  
  pass_threshold := COALESCE(pass_threshold, 70);
  
  -- Calculate total override adjustments
  SELECT 
    COALESCE(SUM(override_score - original_score), 0),
    COUNT(*)
  INTO total_adjustment, override_count
  FROM public.quiz_answer_overrides
  WHERE quiz_attempt_id = attempt_id;
  
  -- Calculate final score
  final_score := GREATEST(0, attempt_record.score + total_adjustment);
  max_score := attempt_record.max_score;
  
  -- Determine if passed based on final score
  final_passed := CASE 
    WHEN max_score > 0 THEN (final_score::decimal / max_score * 100) >= pass_threshold
    ELSE false
  END;
  
  -- Return comprehensive result
  RETURN jsonb_build_object(
    'attempt_id', attempt_id,
    'original_score', attempt_record.score,
    'final_score', final_score,
    'max_score', max_score,
    'total_adjustment', total_adjustment,
    'override_count', override_count,
    'original_passed', attempt_record.passed,
    'final_passed', final_passed,
    'pass_threshold', pass_threshold,
    'final_percentage', CASE WHEN max_score > 0 THEN ROUND((final_score::decimal / max_score * 100)::numeric, 2) ELSE 0 END
  );
END;
$$;