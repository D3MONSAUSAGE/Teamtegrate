-- Fix RLS policy on qr_attendance_tokens to properly allow service role
DROP POLICY IF EXISTS "Service role can insert attendance tokens" ON public.qr_attendance_tokens;

CREATE POLICY "Service role can manage attendance tokens"
ON public.qr_attendance_tokens
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role') = 'service_role' 
  OR auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'manager')
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role') = 'service_role'
  OR auth.uid() = user_id
);

-- Fix ambiguous id reference in get_pending_time_approvals function
CREATE OR REPLACE FUNCTION public.get_pending_time_approvals(manager_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  clock_in timestamp with time zone,
  clock_out timestamp with time zone,
  duration_minutes integer,
  user_name text,
  user_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    te.id,
    te.user_id,
    te.clock_in,
    te.clock_out,
    te.duration_minutes,
    u.name as user_name,
    u.email as user_email
  FROM time_entries te
  JOIN users u ON u.id = te.user_id
  WHERE te.approval_status = 'pending'
    AND u.organization_id = (
      SELECT organization_id FROM users WHERE users.id = manager_id
    )
  ORDER BY te.clock_in DESC;
END;
$$;