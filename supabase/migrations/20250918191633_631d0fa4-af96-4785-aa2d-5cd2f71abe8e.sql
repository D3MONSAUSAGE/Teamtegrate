-- Create a one-time function to fix the email inconsistency
-- This bypasses RLS restrictions for this specific admin fix

CREATE OR REPLACE FUNCTION fix_email_inconsistency()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the email directly in the users table
  UPDATE public.users 
  SET email = 'franciscolopez@guanatostacos.com'
  WHERE id = '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d'::uuid
    AND email = 'generalmanager@guanatostacos.com';
    
  -- Log that we found and fixed the inconsistency
  IF FOUND THEN
    RAISE NOTICE 'Fixed email inconsistency for user 3cb3ba4f-0ae9-4906-bd68-7d02f687c82d';
  ELSE
    RAISE NOTICE 'No email inconsistency found to fix';
  END IF;
END;
$$;

-- Execute the fix
SELECT fix_email_inconsistency();

-- Drop the function after use
DROP FUNCTION fix_email_inconsistency();