-- Phase 1: Database Schema & Backend Logic Fixes

-- Create function to calculate final quiz attempt score with overrides
CREATE OR REPLACE FUNCTION public.calculate_quiz_attempt_final_score(attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_record RECORD;
  override_record RECORD;
  total_adjustment numeric := 0;
  final_score numeric;
  max_score numeric;
  pass_threshold numeric;
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
    WHEN max_score > 0 THEN (final_score / max_score * 100) >= pass_threshold
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
    'final_percentage', CASE WHEN max_score > 0 THEN ROUND((final_score / max_score * 100)::numeric, 2) ELSE 0 END
  );
END;
$$;

-- Create function to update training assignment completion score
CREATE OR REPLACE FUNCTION public.update_assignment_completion_score(attempt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  attempt_record RECORD;
  final_result jsonb;
  final_score numeric;
  final_passed boolean;
  assignment_status text;
BEGIN
  -- Get attempt details
  SELECT quiz_id, user_id INTO attempt_record
  FROM public.quiz_attempts 
  WHERE id = attempt_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate final score with overrides
  final_result := public.calculate_quiz_attempt_final_score(attempt_id);
  final_score := (final_result->>'final_score')::numeric;
  final_passed := (final_result->>'final_passed')::boolean;
  
  -- Determine assignment status
  assignment_status := CASE WHEN final_passed THEN 'completed' ELSE 'failed' END;
  
  -- Update training assignments
  UPDATE public.training_assignments
  SET 
    completion_score = ROUND((final_score / (final_result->>'max_score')::numeric * 100)::numeric),
    status = assignment_status,
    updated_at = NOW()
  WHERE assigned_to = attempt_record.user_id::uuid
    AND content_id = attempt_record.quiz_id::uuid
    AND assignment_type = 'quiz';
    
  RAISE LOG 'Updated assignment completion score for attempt % to %', attempt_id, final_score;
END;
$$;

-- Create trigger function to update scores when overrides change
CREATE OR REPLACE FUNCTION public.handle_quiz_override_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update assignment scores for the affected attempt
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.update_assignment_completion_score(NEW.quiz_attempt_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_assignment_completion_score(OLD.quiz_attempt_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers on quiz_answer_overrides table
DROP TRIGGER IF EXISTS trigger_quiz_override_insert ON public.quiz_answer_overrides;
DROP TRIGGER IF EXISTS trigger_quiz_override_update ON public.quiz_answer_overrides;
DROP TRIGGER IF EXISTS trigger_quiz_override_delete ON public.quiz_answer_overrides;

CREATE TRIGGER trigger_quiz_override_insert
  AFTER INSERT ON public.quiz_answer_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_quiz_override_change();

CREATE TRIGGER trigger_quiz_override_update
  AFTER UPDATE ON public.quiz_answer_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_quiz_override_change();

CREATE TRIGGER trigger_quiz_override_delete
  AFTER DELETE ON public.quiz_answer_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_quiz_override_change();

-- Create function to get quiz attempts with calculated final scores
CREATE OR REPLACE FUNCTION public.get_quiz_attempts_with_final_scores(quiz_id_param uuid, organization_id_param uuid)
RETURNS TABLE(
  id uuid,
  quiz_id uuid,
  user_id uuid,
  attempt_number integer,
  original_score numeric,
  original_passed boolean,
  final_score numeric,
  final_passed boolean,
  max_score numeric,
  total_adjustment numeric,
  override_count integer,
  answers jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  organization_id uuid,
  has_overrides boolean
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
    qa.score as original_score,
    qa.passed as original_passed,
    COALESCE((public.calculate_quiz_attempt_final_score(qa.id)->>'final_score')::numeric, qa.score) as final_score,
    COALESCE((public.calculate_quiz_attempt_final_score(qa.id)->>'final_passed')::boolean, qa.passed) as final_passed,
    qa.max_score,
    COALESCE((public.calculate_quiz_attempt_final_score(qa.id)->>'total_adjustment')::numeric, 0) as total_adjustment,
    COALESCE((public.calculate_quiz_attempt_final_score(qa.id)->>'override_count')::integer, 0) as override_count,
    qa.answers,
    qa.started_at,
    qa.completed_at,
    qa.organization_id,
    COALESCE((public.calculate_quiz_attempt_final_score(qa.id)->>'override_count')::integer, 0) > 0 as has_overrides
  FROM public.quiz_attempts qa
  WHERE qa.quiz_id = quiz_id_param
    AND qa.organization_id = organization_id_param
  ORDER BY qa.started_at DESC;
END;
$$;