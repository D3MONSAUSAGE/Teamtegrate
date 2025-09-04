-- Drop the conflicting legacy RLS policy that requires overridden_by = auth.uid()
DROP POLICY IF EXISTS "Users can update their own overrides" ON public.quiz_answer_overrides;

-- Update the trigger to set overridden_by on updates for audit trail
CREATE OR REPLACE FUNCTION public.set_quiz_override_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT, set the overridden_by to current user
  IF TG_OP = 'INSERT' THEN
    NEW.overridden_by := auth.uid();
    NEW.overridden_at := now();
  END IF;
  
  -- On UPDATE, update the overridden_by to current user for audit trail
  IF TG_OP = 'UPDATE' THEN
    NEW.overridden_by := auth.uid();
    NEW.overridden_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;