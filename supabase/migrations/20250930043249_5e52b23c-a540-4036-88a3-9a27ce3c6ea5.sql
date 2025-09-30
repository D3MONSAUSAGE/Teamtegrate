-- Fix search_path for audit function (security best practice)
CREATE OR REPLACE FUNCTION audit_verification_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when someone tries to verify
  IF NEW.verified_status IS DISTINCT FROM OLD.verified_status THEN
    RAISE LOG 'Verification attempt: user=%, instance=%, old_status=%, new_status=%',
      auth.uid(), NEW.instance_id, OLD.verified_status, NEW.verified_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public';