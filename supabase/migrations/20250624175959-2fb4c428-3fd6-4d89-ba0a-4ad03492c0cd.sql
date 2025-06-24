
-- Fix the get_current_user_organization_id function to properly retrieve organization_id
-- The current function may not be working due to session/auth issues
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_auth_uid UUID;
  found_org_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_auth_uid := auth.uid();
  
  -- Debug logging
  RAISE LOG 'get_current_user_organization_id: auth.uid() = %', current_auth_uid;
  
  -- If auth.uid() is null, return null immediately
  IF current_auth_uid IS NULL THEN
    RAISE LOG 'get_current_user_organization_id: No authenticated user found';
    RETURN NULL;
  END IF;
  
  -- Get the organization_id for the authenticated user
  SELECT organization_id INTO found_org_id 
  FROM public.users 
  WHERE id = current_auth_uid;
  
  -- Debug logging
  RAISE LOG 'get_current_user_organization_id: Found org_id = % for user = %', found_org_id, current_auth_uid;
  
  RETURN found_org_id;
END;
$$;

-- Test the function to ensure it works
SELECT public.get_current_user_organization_id() as current_org_id;

-- Also add a helper function to debug auth issues
CREATE OR REPLACE FUNCTION public.debug_auth_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  auth_uid UUID;
  user_exists BOOLEAN;
  user_org_id UUID;
  result JSON;
BEGIN
  -- Get current auth user
  auth_uid := auth.uid();
  
  -- Check if user exists in users table
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = auth_uid) INTO user_exists;
  
  -- Get user's organization_id if they exist
  IF user_exists THEN
    SELECT organization_id INTO user_org_id FROM public.users WHERE id = auth_uid;
  END IF;
  
  -- Build result
  result := json_build_object(
    'auth_uid', auth_uid,
    'user_exists_in_users_table', user_exists,
    'user_organization_id', user_org_id,
    'current_timestamp', now()
  );
  
  RETURN result;
END;
$$;
