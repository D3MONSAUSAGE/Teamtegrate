-- 1) Expand allowed action types and fix audit trigger for certificate uploads
-- Safe transaction block
BEGIN;

-- Drop existing check constraint if present and recreate with expanded values
ALTER TABLE public.training_assignment_audit
  DROP CONSTRAINT IF EXISTS training_assignment_audit_action_type_check;

ALTER TABLE public.training_assignment_audit
  ADD CONSTRAINT training_assignment_audit_action_type_check
  CHECK (action_type IN (
    'created',
    'reassigned',
    'completed',
    'status_changed',
    'certificate_uploaded',
    'updated'
  ));

-- Helpful index for filtering by action type
CREATE INDEX IF NOT EXISTS idx_training_assignment_audit_action_type
  ON public.training_assignment_audit (action_type);

-- Replace the audit trigger function with robust logic that detects certificate uploads
CREATE OR REPLACE FUNCTION public.log_training_assignment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Detect reassignment
    IF NEW.reassigned_by IS NOT NULL AND (OLD.reassigned_by IS NULL OR OLD.reassigned_by IS DISTINCT FROM NEW.reassigned_by) THEN
      v_action := 'reassigned';

    -- Detect completion
    ELSIF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at IS DISTINCT FROM NEW.completed_at) THEN
      v_action := 'completed';

    -- Detect certificate upload or changes related to certificate
    ELSIF (NEW.certificate_url IS DISTINCT FROM OLD.certificate_url)
       OR (NEW.certificate_uploaded_at IS NOT NULL AND (OLD.certificate_uploaded_at IS NULL OR OLD.certificate_uploaded_at IS DISTINCT FROM NEW.certificate_uploaded_at))
       OR (NEW.certificate_status IS DISTINCT FROM OLD.certificate_status AND NEW.certificate_status = 'uploaded') THEN
      v_action := 'certificate_uploaded';

    -- Detect status changes
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'status_changed';

    ELSE
      v_action := 'updated';
    END IF;
  ELSE
    v_action := 'updated';
  END IF;

  INSERT INTO public.training_assignment_audit (
    organization_id,
    assignment_id,
    action_type,
    performed_by,
    old_values,
    new_values,
    reason
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    COALESCE(NEW.id, OLD.id),
    v_action,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    CASE 
      WHEN v_action = 'reassigned' THEN NEW.reassignment_reason
      ELSE NULL
    END
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

COMMIT;