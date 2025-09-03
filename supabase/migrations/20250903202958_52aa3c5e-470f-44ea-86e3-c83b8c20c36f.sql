
-- 1) Remove the recalculation trigger that references non-existent quiz_answers table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'quiz_answer_overrides'
      AND t.tgname = 'quiz_override_score_recalculation'
  ) THEN
    EXECUTE 'DROP TRIGGER quiz_override_score_recalculation ON public.quiz_answer_overrides';
  END IF;
END;
$$;

-- 2) Drop the wrapper trigger function (no longer used)
DROP FUNCTION IF EXISTS public.trigger_recalculate_score();

-- 3) Optional: add an index to speed up lookups by attempt
CREATE INDEX IF NOT EXISTS idx_quiz_answer_overrides_attempt
  ON public.quiz_answer_overrides (quiz_attempt_id);
