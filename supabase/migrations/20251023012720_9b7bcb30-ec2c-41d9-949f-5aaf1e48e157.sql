-- Update handle_new_user function to link pending employees
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id UUID;
  user_role TEXT;
  invite_code TEXT;
  invite_result JSONB;
  org_name TEXT;
  invited_team_id UUID;
  pending_employee RECORD;
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
    user_role := COALESCE(invite_result->>'invited_role', 'user'); -- Use invited role
    invited_team_id := (invite_result->>'invited_team_id')::UUID;
    RAISE LOG 'handle_new_user: User % joined via invite code with role %', NEW.email, user_role;
    
    -- Check if there's a pending employee record for this email in the organization
    SELECT * INTO pending_employee
    FROM public.users
    WHERE email = NEW.email
      AND organization_id = user_org_id
      AND is_pending_invite = true
    LIMIT 1;
    
    IF pending_employee.id IS NOT NULL THEN
      -- Update existing employee record with auth ID and activate
      UPDATE public.users
      SET 
        id = NEW.id,
        is_pending_invite = false,
        updated_at = NOW()
      WHERE id = pending_employee.id;
      
      -- Use the preset role from employee record
      user_role := pending_employee.role;
      
      RAISE LOG 'handle_new_user: Linked pending employee % to auth user % with role %', 
        pending_employee.id, NEW.id, user_role;
      
      -- If invited to a specific team, add them to that team
      IF invited_team_id IS NOT NULL THEN
        INSERT INTO public.team_memberships (team_id, user_id, role)
        VALUES (invited_team_id, NEW.id, 'member')
        ON CONFLICT (team_id, user_id) DO NOTHING;
        RAISE LOG 'handle_new_user: Added user % to team %', NEW.email, invited_team_id;
      END IF;
      
      RETURN NEW;
    END IF;
  END IF;
  
  -- If no organization is specified, assign to Legacy Org with 'user' role
  IF user_org_id IS NULL THEN
    SELECT id INTO user_org_id FROM public.organizations WHERE name = 'Legacy Org';
    
    IF user_org_id IS NULL THEN
      INSERT INTO public.organizations (id, name, created_by, created_at)
      VALUES (gen_random_uuid(), 'Legacy Org', NEW.id, NOW())
      RETURNING id INTO user_org_id;
      RAISE LOG 'handle_new_user: Created Legacy Org for user %', NEW.email;
    END IF;
    
    user_role := 'user'; -- Default to user role for Legacy Org
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
    
    -- If invited to a specific team, add them to that team
    IF invited_team_id IS NOT NULL THEN
      INSERT INTO public.team_memberships (team_id, user_id, role)
      VALUES (invited_team_id, NEW.id, 'member')
      ON CONFLICT (team_id, user_id) DO NOTHING;
      RAISE LOG 'handle_new_user: Added user % to team %', NEW.email, invited_team_id;
    END IF;
    
    RAISE LOG 'handle_new_user: Successfully created user % with role % in organization %', NEW.email, user_role, user_org_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: ERROR creating user %: %', NEW.email, SQLERRM;
    RAISE;
  END;
  
  RETURN NEW;
END;
$$;