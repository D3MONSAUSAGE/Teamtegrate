-- Drop the restrictive policy that prevents service role from inserting tokens
DROP POLICY IF EXISTS "Users can generate their own QR tokens" ON public.qr_attendance_tokens;

-- Create a new policy that allows both users AND service role (edge functions)
CREATE POLICY "Users and system can generate QR tokens"
  ON public.qr_attendance_tokens 
  FOR INSERT
  WITH CHECK (
    -- Allow if current user matches token user (direct user calls)
    (auth.uid() = user_id AND organization_id = get_current_user_organization_id())
    OR
    -- Allow if called by service role (edge functions)
    (auth.role() = 'service_role')
  );