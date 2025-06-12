
-- Add debug logging to the get_current_user_organization_id function
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_auth_uid UUID;
  found_org_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Get the current authenticated user ID
  current_auth_uid := auth.uid();
  
  -- Log the auth.uid() result
  RAISE LOG 'DEBUG: auth.uid() returned: %', current_auth_uid;
  
  -- Check if auth.uid() is null
  IF current_auth_uid IS NULL THEN
    RAISE LOG 'WARNING: auth.uid() is NULL - user not authenticated or session invalid';
    RETURN NULL;
  END IF;
  
  -- Check if user exists in users table
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = current_auth_uid) INTO user_exists;
  RAISE LOG 'DEBUG: User exists in users table: %', user_exists;
  
  -- Get the organization_id
  SELECT organization_id INTO found_org_id FROM public.users WHERE id = current_auth_uid;
  
  -- Log what we found
  RAISE LOG 'DEBUG: Found organization_id: % for user: %', found_org_id, current_auth_uid;
  
  -- Check if organization_id is null
  IF found_org_id IS NULL THEN
    RAISE LOG 'WARNING: organization_id is NULL for user: %', current_auth_uid;
  END IF;
  
  RETURN found_org_id;
END;
$function$
