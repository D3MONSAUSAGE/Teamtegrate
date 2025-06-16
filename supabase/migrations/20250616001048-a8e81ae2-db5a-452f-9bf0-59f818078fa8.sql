
-- Fix the generate_invite_code function to use alternative random generation
CREATE OR REPLACE FUNCTION public.generate_invite_code(
  org_id uuid, 
  created_by_id uuid, 
  expires_days integer DEFAULT 7, 
  max_uses_param integer DEFAULT NULL::integer
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  
  -- Generate unique code using alternative method
  LOOP
    -- Create a random string using md5 hash of random number and timestamp
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
  
  -- Insert new invite
  INSERT INTO public.organization_invites (
    organization_id, 
    invite_code, 
    created_by, 
    expires_at, 
    max_uses
  ) VALUES (
    org_id, 
    new_code, 
    created_by_id, 
    now() + (expires_days || ' days')::interval,
    max_uses_param
  );
  
  RETURN new_code;
END;
$$;
