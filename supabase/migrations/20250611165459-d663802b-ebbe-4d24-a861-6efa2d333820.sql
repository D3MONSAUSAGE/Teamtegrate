
-- Create table for organization invite codes
CREATE TABLE public.organization_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  max_uses INTEGER DEFAULT NULL, -- NULL = unlimited uses
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on organization_invites
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_invites
CREATE POLICY "Users can view invites for their organization" 
ON public.organization_invites 
FOR SELECT 
USING (
  organization_id = (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Superadmins can insert invites for their organization" 
ON public.organization_invites 
FOR INSERT 
WITH CHECK (
  organization_id = (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

CREATE POLICY "Superadmins can update invites for their organization" 
ON public.organization_invites 
FOR UPDATE 
USING (
  organization_id = (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Function to validate and use invite code
CREATE OR REPLACE FUNCTION public.validate_and_use_invite_code(code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invite_record RECORD;
  result JSONB;
BEGIN
  -- Get invite details
  SELECT 
    id, 
    organization_id, 
    max_uses, 
    current_uses, 
    is_active, 
    expires_at
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
  
  -- Return success with organization_id
  RETURN jsonb_build_object(
    'success', true, 
    'organization_id', invite_record.organization_id
  );
END;
$$;

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code(org_id UUID, created_by_id UUID, expires_days INTEGER DEFAULT 7, max_uses_param INTEGER DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
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
  
  -- Generate unique code
  LOOP
    new_code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
    new_code := replace(new_code, '/', '');
    new_code := replace(new_code, '+', '');
    
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

-- Update handle_new_user function to support multi-tenant signup
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
BEGIN
  -- Get organization info from user metadata
  user_org_id := NEW.raw_user_meta_data->>'organization_id';
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  invite_code := NEW.raw_user_meta_data->>'invite_code';
  
  -- If invite code is provided, validate and use it
  IF invite_code IS NOT NULL THEN
    SELECT public.validate_and_use_invite_code(invite_code) INTO invite_result;
    
    IF (invite_result->>'success')::boolean = false THEN
      RAISE EXCEPTION 'Invite validation failed: %', invite_result->>'error';
    END IF;
    
    user_org_id := (invite_result->>'organization_id')::UUID;
    user_role := 'user'; -- Users joining via invite get 'user' role
  END IF;
  
  -- If no organization is specified, assign to Legacy Org
  IF user_org_id IS NULL THEN
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_invites_code ON public.organization_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_organization_invites_org_id ON public.organization_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_expires_at ON public.organization_invites(expires_at);
