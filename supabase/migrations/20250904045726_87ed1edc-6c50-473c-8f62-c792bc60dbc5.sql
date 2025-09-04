
-- 1) Drop existing status check constraint (name from error message)
ALTER TABLE public.training_assignments
  DROP CONSTRAINT IF EXISTS training_assignments_status_check;

-- 2) Recreate it allowing 'failed' (and the existing common states)
ALTER TABLE public.training_assignments
  ADD CONSTRAINT training_assignments_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'));
