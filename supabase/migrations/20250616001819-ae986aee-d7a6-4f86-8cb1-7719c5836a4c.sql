
-- Create a new function that validates invite codes WITHOUT consuming them
CREATE OR REPLACE FUNCTION public.validate_invite_code_without_consuming(code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  invite_record RECORD;
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
  
  -- Check usage limits (but don't consume)
  IF invite_record.max_uses IS NOT NULL AND invite_record.current_uses >= invite_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite code has reached maximum usage limit');
  END IF;
  
  -- Return success with organization_id (but don't increment usage)
  RETURN jsonb_build_object(
    'success', true, 
    'organization_id', invite_record.organization_id
  );
END;
$$;
