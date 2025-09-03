-- Create quiz answer overrides table
CREATE TABLE public.quiz_answer_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  quiz_attempt_id uuid NOT NULL,
  question_id uuid NOT NULL,
  original_score integer NOT NULL,
  override_score integer NOT NULL,
  reason text NOT NULL,
  overridden_by uuid NOT NULL,
  overridden_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_answer_overrides ENABLE ROW LEVEL SECURITY;

-- RLS policies for quiz answer overrides
CREATE POLICY "Admins can manage overrides in their organization"
ON public.quiz_answer_overrides
FOR ALL
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'manager')
  )
)
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  overridden_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'manager')
  )
);

-- Function to recalculate quiz attempt score after overrides
CREATE OR REPLACE FUNCTION public.recalculate_attempt_score(p_quiz_attempt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_score integer := 0;
  max_possible_score integer := 0;
  answer_record RECORD;
BEGIN
  -- Calculate total score considering overrides
  FOR answer_record IN 
    SELECT 
      qa.question_id,
      qq.points,
      COALESCE(qao.override_score, qa.score) as final_score
    FROM quiz_answers qa
    JOIN quiz_questions qq ON qa.question_id = qq.id
    LEFT JOIN quiz_answer_overrides qao ON (
      qao.quiz_attempt_id = qa.quiz_attempt_id AND 
      qao.question_id = qa.question_id
    )
    WHERE qa.quiz_attempt_id = p_quiz_attempt_id
  LOOP
    total_score := total_score + answer_record.final_score;
    max_possible_score := max_possible_score + answer_record.points;
  END LOOP;

  -- Update the quiz attempt with new score
  UPDATE public.quiz_attempts 
  SET 
    score = total_score,
    max_score = max_possible_score,
    updated_at = now()
  WHERE id = p_quiz_attempt_id;
END;
$$;

-- Trigger to auto-update quiz attempt score when override is added/updated/deleted
CREATE OR REPLACE FUNCTION public.trigger_recalculate_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Get the quiz_attempt_id from either NEW or OLD record
  PERFORM public.recalculate_attempt_score(
    COALESCE(NEW.quiz_attempt_id, OLD.quiz_attempt_id)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers
CREATE TRIGGER quiz_override_score_recalculation
  AFTER INSERT OR UPDATE OR DELETE
  ON public.quiz_answer_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_score();

-- Add updated_at trigger
CREATE TRIGGER update_quiz_answer_overrides_updated_at
  BEFORE UPDATE ON public.quiz_answer_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();