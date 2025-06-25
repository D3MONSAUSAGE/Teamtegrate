
-- Add role and team fields to organization_invites table
ALTER TABLE public.organization_invites 
ADD COLUMN invited_role text DEFAULT 'user',
ADD COLUMN invited_team_id uuid REFERENCES public.teams(id);

-- Add constraint to ensure invited_role is valid
ALTER TABLE public.organization_invites 
ADD CONSTRAINT valid_invited_role 
CHECK (invited_role IN ('user', 'manager', 'admin'));

-- Update the generate_invite_code function to support role and team
CREATE OR REPLACE FUNCTION public.generate_invite_code_with_role(
  org_id uuid, 
  created_by_id uuid, 
  invited_role text DEFAULT 'user',
  invited_team_id uuid DEFAULT NULL,
  expires_days integer DEFAULT 7, 
  max_uses_param integer DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  random_part TEXT;
BEGIN
  -- Verify user is superadmin in the organization
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = created_by_id 
    AND organization_id = org_id 
    AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can generate invite codes';
  END IF;
  
  -- Validate invited_role
  IF invited_role NOT IN ('user', 'manager', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;
  
  -- Validate team exists in organization if specified
  IF invited_team_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = invited_team_id 
      AND organization_id = org_id 
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Invalid team specified';
    END IF;
  END IF;
  
  -- Generate unique code
  LOOP
    random_part := upper(substring(md5(random()::text || extract(epoch from now())::text) from 1 for 8));
    new_code := random_part;
    
    -- Remove confusing characters
    new_code := replace(new_code, '0', 'X');
    new_code := replace(new_code, 'O', 'Y');
    new_code := replace(new_code, '1', 'Z');
    new_code := replace(new_code, 'I', 'W');
    
    SELECT EXISTS(SELECT 1 FROM public.organization_invites WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Insert new invite with role and team
  INSERT INTO public.organization_invites (
    organization_id, 
    invite_code, 
    created_by, 
    expires_at, 
    max_uses,
    invited_role,
    invited_team_id
  ) VALUES (
    org_id, 
    new_code, 
    created_by_id, 
    now() + (expires_days || ' days')::interval,
    max_uses_param,
    invited_role,
    invited_team_id
  );
  
  RETURN new_code;
END;
$$;

-- Update validate_and_use_invite_code to return role and team info
CREATE OR REPLACE FUNCTION public.validate_and_use_invite_code(code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Get invite details including role and team
  SELECT 
    id, 
    organization_id, 
    max_uses, 
    current_uses, 
    is_active, 
    expires_at,
    invited_role,
    invited_team_id
  INTO invite_record
  FROM public.organization_invites 
  WHERE invite_code = code;
  
  -- Check if invite exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code');
  END IF;
  
  -- Check if invite is active
  IF NOT invite_record.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite code has been deactivated');
  END IF;
  
  -- Check if invite has expired
  IF invite_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite code has expired');
  END IF;
  
  -- Check usage limits
  IF invite_record.max_uses IS NOT NULL AND invite_record.current_uses >= invite_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite code has reached maximum usage limit');
  END IF;
  
  -- Increment usage count
  UPDATE public.organization_invites 
  SET current_uses = current_uses + 1 
  WHERE id = invite_record.id;
  
  -- Return success with organization_id, role, and team
  RETURN jsonb_build_object(
    'success', true, 
    'organization_id', invite_record.organization_id,
    'invited_role', invite_record.invited_role,
    'invited_team_id', invite_record.invited_team_id
  );
END;
$$;

-- Update handle_new_user function to respect invite code role and team assignments
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
  invited_team_id UUID;
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
      VALUES (invited_team_id, NEW.id, 'member');
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
