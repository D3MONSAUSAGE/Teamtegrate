-- Create security definer function to check if user can access a request based on team relationships
CREATE OR REPLACE FUNCTION public.can_access_request_by_team(request_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
BEGIN
  current_user_id := auth.uid();
  
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM public.users 
  WHERE id = current_user_id;
  
  -- If user is the requester, always allow
  IF current_user_id = request_user_id THEN
    RETURN true;
  END IF;
  
  -- If user is admin or superadmin, allow access to all in organization
  IF current_user_role IN ('admin', 'superadmin') THEN
    RETURN true;
  END IF;
  
  -- If user is manager, check if request user is in one of their teams
  IF current_user_role IN ('manager', 'team_leader') THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.team_memberships tm1
      JOIN public.teams t ON tm1.team_id = t.id
      JOIN public.team_memberships tm2 ON tm2.team_id = t.id
      WHERE t.manager_id = current_user_id::text
        AND tm2.user_id = request_user_id
        AND t.is_active = true
    );
  END IF;
  
  -- Default deny
  RETURN false;
END;
$$;

-- Drop existing RLS policies on requests table
DROP POLICY IF EXISTS "Users can view requests in their organization" ON public.requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can view all requests in organization" ON public.requests;

-- Create new team-based access policy for SELECT
CREATE POLICY "Team-based request access" 
ON public.requests 
FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() 
  AND can_access_request_by_team(requested_by)
);

-- Ensure other policies remain intact for INSERT/UPDATE/DELETE
-- Users can create their own requests
CREATE POLICY IF NOT EXISTS "Users can create requests" 
ON public.requests 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND requested_by = auth.uid()
);

-- Users can update their own requests (drafts)
CREATE POLICY IF NOT EXISTS "Users can update their own requests" 
ON public.requests 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND requested_by = auth.uid()
  AND status = 'draft'
);

-- Managers and admins can update requests for approval/assignment
CREATE POLICY IF NOT EXISTS "Managers can update requests for processing" 
ON public.requests 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'manager', 'team_leader')
    )
    OR assigned_to = auth.uid()
    OR accepted_by = auth.uid()
  )
);