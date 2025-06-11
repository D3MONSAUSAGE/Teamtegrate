
-- Update handle_new_user function to properly handle organization creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_org_id UUID;
  user_role TEXT;
  invite_code TEXT;
  invite_result JSONB;
  org_name TEXT;
BEGIN
  -- Get organization info from user metadata
  user_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  invite_code := NEW.raw_user_meta_data->>'invite_code';
  org_name := NEW.raw_user_meta_data->>'organizationName';
  
  -- If invite code is provided, validate and use it
  IF invite_code IS NOT NULL THEN
    SELECT public.validate_and_use_invite_code(invite_code) INTO invite_result;
    
    IF (invite_result->>'success')::boolean = false THEN
      RAISE EXCEPTION 'Invite validation failed: %', invite_result->>'error';
    END IF;
    
    user_org_id := (invite_result->>'organization_id')::UUID;
    user_role := 'user'; -- Users joining via invite get 'user' role
    
  -- If organization name is provided, create new organization
  ELSIF org_name IS NOT NULL THEN
    INSERT INTO public.organizations (id, name, created_by, created_at)
    VALUES (gen_random_uuid(), org_name, NEW.id, NOW())
    RETURNING id INTO user_org_id;
    
    user_role := 'superadmin'; -- Organization creators become superadmin
    
  -- If no organization is specified, assign to Legacy Org
  ELSE
    SELECT id INTO user_org_id FROM public.organizations WHERE name = 'Legacy Org';
    
    IF user_org_id IS NULL THEN
      INSERT INTO public.organizations (id, name, created_by, created_at)
      VALUES (gen_random_uuid(), 'Legacy Org', NEW.id, NOW())
      RETURNING id INTO user_org_id;
    END IF;
  END IF;

  -- Insert user with organization assignment
  INSERT INTO public.users (id, name, email, role, organization_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 
    NEW.email, 
    user_role,
    user_org_id
  );
  
  RETURN NEW;
END;
$$;
