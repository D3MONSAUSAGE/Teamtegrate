-- Fix security: Add search_path to helper functions
-- This addresses the "Function Search Path Mutable" warnings

DROP FUNCTION IF EXISTS get_days_in_current_stage(UUID);
DROP FUNCTION IF EXISTS check_reference_threshold(UUID);
DROP FUNCTION IF EXISTS get_candidate_average_rating(UUID);

-- Function to get days in current stage (with security fix)
CREATE OR REPLACE FUNCTION get_days_in_current_stage(p_candidate_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  days_count INTEGER;
BEGIN
  SELECT EXTRACT(DAY FROM (NOW() - entered_date))::INTEGER
  INTO days_count
  FROM public.recruitment_candidate_stages
  WHERE candidate_id = p_candidate_id
    AND completed_date IS NULL
  ORDER BY entered_date DESC
  LIMIT 1;
  
  RETURN COALESCE(days_count, 0);
END;
$$;

-- Function to check if reference check threshold is met (with security fix)
CREATE OR REPLACE FUNCTION check_reference_threshold(p_candidate_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  answered_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE call_status = 'answered'),
    COUNT(*)
  INTO answered_count, total_count
  FROM public.recruitment_references
  WHERE candidate_id = p_candidate_id;
  
  -- Require at least 2 answered out of minimum 3 references
  RETURN answered_count >= 2 AND total_count >= 3;
END;
$$;

-- Function to calculate average interview rating (with security fix)
CREATE OR REPLACE FUNCTION get_candidate_average_rating(p_candidate_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  SELECT AVG(rating)::NUMERIC(3,2)
  INTO avg_rating
  FROM public.recruitment_interview_feedback
  WHERE candidate_id = p_candidate_id;
  
  RETURN COALESCE(avg_rating, 0);
END;
$$;