
-- First, create the missing trigger that should have added users to the public.users table
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add Josue Robledo to the public.users table (he exists in auth but missing from public.users)
-- Using the organization ID from the existing users (they're all in the same org)
INSERT INTO public.users (id, name, email, role, organization_id, created_at)
SELECT 
  'e158e6d9-3ba7-4dbb-84b5-1ec0110d3931'::uuid,
  'Josue Robledo',
  'josuerobledo@guanatostacos.com',
  'superadmin',
  organization_id,
  NOW()
FROM public.users 
WHERE email = 'generalmanager@guanatostacos.com'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Create a function to help identify and sync missing users between auth.users and public.users
CREATE OR REPLACE FUNCTION public.find_missing_users()
RETURNS TABLE(
  auth_user_id uuid,
  auth_email text,
  auth_created_at timestamp with time zone,
  missing_from_public boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at,
    (pu.id IS NULL) as missing_from_public
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE au.email IS NOT NULL
  ORDER BY au.created_at DESC;
END;
$$;

-- Improve the handle_new_user function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_org_id UUID;
  user_role TEXT;
  invite_code TEXT;
  invite_result JSONB;
  org_name TEXT;
BEGIN
  -- Log the signup attempt
  RAISE LOG 'handle_new_user: Processing new user signup for email: %', NEW.email;
  
  -- Get organization info from user metadata
  user_org_id := NEW.raw_user_meta_data->>'organization_id';
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  invite_code := NEW.raw_user_meta_data->>'invite_code';
  org_name := NEW.raw_user_meta_data->>'organizationName';
  
  -- If creating a new organization
  IF NEW.raw_user_meta_data->>'organizationType' = 'create' AND org_name IS NOT NULL THEN
    INSERT INTO public.organizations (id, name, created_by, created_at)
    VALUES (gen_random_uuid(), org_name, NEW.id, NOW())
    RETURNING id INTO user_org_id;
    
    user_role := 'superadmin'; -- Creator becomes superadmin
    RAISE LOG 'handle_new_user: Created new organization % for user %', org_name, NEW.email;
  END IF;
  
  -- If invite code is provided, validate and use it
  IF invite_code IS NOT NULL THEN
    SELECT public.validate_and_use_invite_code(invite_code) INTO invite_result;
    
    IF (invite_result->>'success')::boolean = false THEN
      RAISE EXCEPTION 'Invite validation failed: %', invite_result->>'error';
    END IF;
    
    user_org_id := (invite_result->>'organization_id')::UUID;
    user_role := 'user'; -- Users joining via invite get 'user' role
    RAISE LOG 'handle_new_user: User % joined via invite code', NEW.email;
  END IF;
  
  -- If no organization is specified, assign to Legacy Org
  IF user_org_id IS NULL THEN
    SELECT id INTO user_org_id FROM public.organizations WHERE name = 'Legacy Org';
    
    IF user_org_id IS NULL THEN
      INSERT INTO public.organizations (id, name, created_by, created_at)
      VALUES (gen_random_uuid(), 'Legacy Org', NEW.id, NOW())
      RETURNING id INTO user_org_id;
      RAISE LOG 'handle_new_user: Created Legacy Org for user %', NEW.email;
    END IF;
  END IF;

  -- Insert user with organization assignment
  BEGIN
    INSERT INTO public.users (id, name, email, role, organization_id)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 
      NEW.email, 
      user_role,
      user_org_id
    );
    
    RAISE LOG 'handle_new_user: Successfully created user % with role % in organization %', NEW.email, user_role, user_org_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: ERROR creating user %: %', NEW.email, SQLERRM;
    RAISE;
  END;
  
  RETURN NEW;
END;
$$;
