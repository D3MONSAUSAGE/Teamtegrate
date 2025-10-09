-- Fix team role assignment for invited users
-- This updates the handle_new_user function to properly assign team roles
-- based on the user's organization role

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_org_id UUID;
  user_role TEXT := 'user';
  invite_code TEXT;
  invite_result JSONB;
  org_name TEXT;
  invited_team_id UUID;
  team_role TEXT; -- Variable for team-specific role
BEGIN
  RAISE LOG 'handle_new_user: Starting for user %', NEW.email;
  
  -- Check for invite code in metadata
  invite_code := NEW.raw_user_meta_data->>'invite_code';
  RAISE LOG 'handle_new_user: Invite code from metadata: %', invite_code;
  
  IF invite_code IS NOT NULL THEN
    -- Validate and use the invite code
    SELECT public.validate_and_use_invite_code(invite_code) INTO invite_result;
    RAISE LOG 'handle_new_user: Invite validation result: %', invite_result;
    
    IF invite_result->>'success' = 'true' THEN
      user_org_id := (invite_result->>'organization_id')::UUID;
      user_role := COALESCE(invite_result->>'invited_role', 'user');
      invited_team_id := (invite_result->>'invited_team_id')::UUID;
      
      RAISE LOG 'handle_new_user: User % joining org % with role % and team %', 
        NEW.email, user_org_id, user_role, invited_team_id;
    ELSE
      RAISE LOG 'handle_new_user: Invalid invite code for user %', NEW.email;
      RAISE EXCEPTION 'Invalid or expired invite code';
    END IF;
  ELSE
    -- No invite code - create new organization
    org_name := COALESCE(
      NEW.raw_user_meta_data->>'organization_name',
      split_part(NEW.email, '@', 1) || '''s Organization'
    );
    
    INSERT INTO public.organizations (name)
    VALUES (org_name)
    RETURNING id INTO user_org_id;
    
    user_role := 'superadmin';
    RAISE LOG 'handle_new_user: Created new org % for user %', user_org_id, NEW.email;
  END IF;

  -- Insert user with determined role
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    organization_id,
    timezone
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    user_role,
    user_org_id,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  );

  RAISE LOG 'handle_new_user: Created user record for %', NEW.email;

  -- Add user to team if invited to a specific team
  IF invited_team_id IS NOT NULL THEN
    -- Determine team role based on organization role
    IF user_role IN ('manager', 'admin', 'superadmin') THEN
      team_role := 'manager';
      
      -- Set user as team manager if team doesn't have one
      UPDATE public.teams 
      SET manager_id = NEW.id::text
      WHERE id = invited_team_id 
        AND (manager_id IS NULL OR manager_id = '');
      
      RAISE LOG 'handle_new_user: Set user % as manager of team %', NEW.email, invited_team_id;
    ELSE
      team_role := 'member';
    END IF;
    
    -- Insert with appropriate team role
    INSERT INTO public.team_memberships (team_id, user_id, role)
    VALUES (invited_team_id, NEW.id, team_role);
    
    RAISE LOG 'handle_new_user: Added user % to team % with team role %', NEW.email, invited_team_id, team_role;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Error for user %: %', NEW.email, SQLERRM;
    RAISE;
END;
$$;