-- Add team_id to employee_schedules table
ALTER TABLE public.employee_schedules 
ADD COLUMN team_id UUID REFERENCES public.teams(id);

-- Create index for better performance on team-based queries
CREATE INDEX idx_employee_schedules_team_id ON public.employee_schedules(team_id);

-- Update RLS policies for team-based access control
DROP POLICY IF EXISTS "Users can view employee schedules in their organization" ON public.employee_schedules;
DROP POLICY IF EXISTS "Managers can create employee schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Managers can update employee schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Managers can delete employee schedules" ON public.employee_schedules;

-- Create helper function to get user's managed team IDs
CREATE OR REPLACE FUNCTION public.get_user_managed_team_ids(user_id_param UUID)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  team_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(tm.team_id) INTO team_ids
  FROM public.team_memberships tm
  JOIN public.teams t ON tm.team_id = t.id
  WHERE tm.user_id = user_id_param 
    AND tm.role = 'manager'
    AND t.is_active = true
    AND t.organization_id = get_current_user_organization_id();
  
  RETURN COALESCE(team_ids, ARRAY[]::UUID[]);
END;
$$;

-- Create helper function to check if user is member of a team
CREATE OR REPLACE FUNCTION public.is_user_team_member(user_id_param UUID, team_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_memberships tm
    JOIN public.teams t ON tm.team_id = t.id
    WHERE tm.user_id = user_id_param 
      AND tm.team_id = team_id_param
      AND t.is_active = true
      AND t.organization_id = get_current_user_organization_id()
  );
END;
$$;

-- New RLS policies for team-based access
CREATE POLICY "Admin and superadmin can view all schedules"
ON public.employee_schedules
FOR SELECT
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Managers can view their team schedules"
ON public.employee_schedules
FOR SELECT
USING (
  organization_id = get_current_user_organization_id() AND
  (
    team_id = ANY(get_user_managed_team_ids(auth.uid())) OR
    employee_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own schedules"
ON public.employee_schedules
FOR SELECT
USING (
  organization_id = get_current_user_organization_id() AND
  employee_id = auth.uid()
);

CREATE POLICY "Managers and admins can create schedules"
ON public.employee_schedules
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'manager')
  )
);

CREATE POLICY "Managers can update their team schedules, admins can update all"
ON public.employee_schedules
FOR UPDATE
USING (
  organization_id = get_current_user_organization_id() AND
  (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    ) OR
    team_id = ANY(get_user_managed_team_ids(auth.uid()))
  )
);

CREATE POLICY "Managers can delete their team schedules, admins can delete all"
ON public.employee_schedules
FOR DELETE
USING (
  organization_id = get_current_user_organization_id() AND
  (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    ) OR
    team_id = ANY(get_user_managed_team_ids(auth.uid()))
  )
);