
-- Create audit log table for tracking user deletions
CREATE TABLE public.user_deletion_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deleted_user_id UUID NOT NULL,
  deleted_user_email TEXT NOT NULL,
  deleted_user_name TEXT NOT NULL,
  deleted_user_role TEXT NOT NULL,
  deleted_by_user_id UUID NOT NULL,
  deleted_by_user_email TEXT NOT NULL,
  deletion_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  affected_resources JSONB NOT NULL DEFAULT '{}',
  deletion_reason TEXT,
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on audit table
ALTER TABLE public.user_deletion_audit ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view audit logs
CREATE POLICY "Only superadmins can view deletion audit logs" 
  ON public.user_deletion_audit 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Only superadmins can insert audit logs (deletion function will use service role)
CREATE POLICY "Only superadmins can insert deletion audit logs" 
  ON public.user_deletion_audit 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Create function to check if user is sole admin in any organization
CREATE OR REPLACE FUNCTION public.is_sole_admin_anywhere(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  org_count INTEGER;
BEGIN
  -- Check if user is the only admin in any organization
  SELECT COUNT(*) INTO org_count
  FROM public.organizations o
  WHERE o.created_by = target_user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.role IN ('admin', 'superadmin') 
    AND u.id != target_user_id
    -- Add additional organization membership logic here if needed
  );
  
  RETURN org_count > 0;
END;
$$;

-- Create function to get user deletion impact summary
CREATE OR REPLACE FUNCTION public.get_user_deletion_impact(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  impact_summary JSONB;
  task_count INTEGER;
  project_count INTEGER;
  chat_room_count INTEGER;
  organization_count INTEGER;
  team_member_count INTEGER;
BEGIN
  -- Count tasks assigned to user
  SELECT COUNT(*) INTO task_count
  FROM public.tasks
  WHERE assigned_to_id = target_user_id::text
  OR target_user_id::text = ANY(assigned_to_ids);

  -- Count projects managed by user
  SELECT COUNT(*) INTO project_count
  FROM public.projects
  WHERE manager_id = target_user_id::text;

  -- Count chat rooms created by user
  SELECT COUNT(*) INTO chat_room_count
  FROM public.chat_rooms
  WHERE created_by = target_user_id;

  -- Count organizations created by user
  SELECT COUNT(*) INTO organization_count
  FROM public.organizations
  WHERE created_by = target_user_id;

  -- Count team memberships
  SELECT COUNT(*) INTO team_member_count
  FROM public.project_team_members
  WHERE user_id = target_user_id;

  -- Build summary object
  impact_summary := jsonb_build_object(
    'tasks_assigned', task_count,
    'projects_managed', project_count,
    'chat_rooms_created', chat_room_count,
    'organizations_created', organization_count,
    'team_memberships', team_member_count,
    'is_sole_admin', public.is_sole_admin_anywhere(target_user_id)
  );

  RETURN impact_summary;
END;
$$;
