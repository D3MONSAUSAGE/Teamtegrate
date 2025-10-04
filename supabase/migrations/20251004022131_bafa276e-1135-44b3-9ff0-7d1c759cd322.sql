-- Create a secure function to insert QR attendance tokens
-- This bypasses RLS using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.create_qr_attendance_token(
  p_organization_id UUID,
  p_user_id UUID,
  p_token TEXT,
  p_token_type TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  user_id UUID,
  token TEXT,
  token_type TEXT,
  expires_at TIMESTAMPTZ,
  is_used BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.qr_attendance_tokens (
    organization_id,
    user_id,
    token,
    token_type,
    expires_at,
    is_used
  )
  VALUES (
    p_organization_id,
    p_user_id,
    p_token,
    p_token_type,
    p_expires_at,
    false
  )
  RETURNING 
    qr_attendance_tokens.id,
    qr_attendance_tokens.organization_id,
    qr_attendance_tokens.user_id,
    qr_attendance_tokens.token,
    qr_attendance_tokens.token_type,
    qr_attendance_tokens.expires_at,
    qr_attendance_tokens.is_used,
    qr_attendance_tokens.created_at;
END;
$$;