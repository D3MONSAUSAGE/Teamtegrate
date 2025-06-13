
-- Add function to check if deletion would leave organization without superadmin
CREATE OR REPLACE FUNCTION public.would_leave_org_without_superadmin(target_user_id uuid, target_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  superadmin_count INTEGER;
  target_user_role TEXT;
BEGIN
  -- Get target user's role
  SELECT role INTO target_user_role
  FROM public.users
  WHERE id = target_user_id AND organization_id = target_org_id;
  
  -- If target user is not a superadmin, deletion is safe
  IF target_user_role != 'superadmin' THEN
    RETURN FALSE;
  END IF;
  
  -- Count superadmins in the organization excluding the target user
  SELECT COUNT(*) INTO superadmin_count
  FROM public.users
  WHERE organization_id = target_org_id 
    AND role = 'superadmin' 
    AND id != target_user_id;
  
  -- Return true if this would leave no superadmins
  RETURN superadmin_count = 0;
END;
$$;

-- Add enhanced user management audit table
CREATE TABLE IF NOT EXISTS public.user_management_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  action_type text NOT NULL, -- 'create', 'update', 'delete', 'role_change', 'suspend', 'activate'
  target_user_id uuid NOT NULL,
  target_user_email text NOT NULL,
  target_user_name text NOT NULL,
  performed_by_user_id uuid NOT NULL,
  performed_by_email text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_management_audit_org_id ON public.user_management_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_management_audit_target_user ON public.user_management_audit(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_management_audit_performed_by ON public.user_management_audit(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_user_management_audit_action_type ON public.user_management_audit(action_type);

-- Enhanced function to get user management impact analysis
CREATE OR REPLACE FUNCTION public.get_user_management_impact(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  impact_summary JSONB;
  task_count INTEGER;
  project_count INTEGER;
  managed_projects INTEGER;
  chat_room_count INTEGER;
  team_member_count INTEGER;
  is_sole_superadmin BOOLEAN;
  user_info RECORD;
BEGIN
  -- Get user information
  SELECT id, email, name, role, organization_id INTO user_info
  FROM public.users
  WHERE id = target_user_id;

  -- Count tasks assigned to user
  SELECT COUNT(*) INTO task_count
  FROM public.tasks
  WHERE assigned_to_id = target_user_id::text
  OR target_user_id::text = ANY(assigned_to_ids);

  -- Count project tasks assigned to user
  SELECT COUNT(*) INTO project_count
  FROM public.project_tasks
  WHERE assigned_to_id = target_user_id
  OR target_user_id = ANY(assigned_to_ids);

  -- Count projects managed by user
  SELECT COUNT(*) INTO managed_projects
  FROM public.projects
  WHERE manager_id = target_user_id::text;

  -- Count chat rooms created by user
  SELECT COUNT(*) INTO chat_room_count
  FROM public.chat_rooms
  WHERE created_by = target_user_id;

  -- Count team memberships
  SELECT COUNT(*) INTO team_member_count
  FROM public.project_team_members
  WHERE user_id = target_user_id;

  -- Check if user is sole superadmin in their organization
  SELECT public.would_leave_org_without_superadmin(target_user_id, user_info.organization_id) INTO is_sole_superadmin;

  -- Build summary object
  impact_summary := jsonb_build_object(
    'user_info', jsonb_build_object(
      'id', user_info.id,
      'email', user_info.email,
      'name', user_info.name,
      'role', user_info.role
    ),
    'tasks_assigned', task_count,
    'project_tasks_assigned', project_count,
    'projects_managed', managed_projects,
    'chat_rooms_created', chat_room_count,
    'team_memberships', team_member_count,
    'is_sole_superadmin', is_sole_superadmin,
    'can_be_deleted', NOT is_sole_superadmin,
    'deletion_blocked_reason', CASE 
      WHEN is_sole_superadmin THEN 'Cannot delete the only superadmin in the organization'
      ELSE null
    END
  );

  RETURN impact_summary;
END;
$$;

-- Function to validate role changes
CREATE OR REPLACE FUNCTION public.can_change_user_role(
  manager_user_id uuid,
  target_user_id uuid,
  new_role text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  manager_info RECORD;
  target_info RECORD;
  result JSONB;
  would_leave_without_superadmin BOOLEAN;
BEGIN
  -- Get manager information
  SELECT role, organization_id, email, name INTO manager_info
  FROM public.users
  WHERE id = manager_user_id;

  -- Get target user information  
  SELECT role, organization_id, email, name INTO target_info
  FROM public.users
  WHERE id = target_user_id;

  -- Check if users are in same organization
  IF manager_info.organization_id != target_info.organization_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Users must be in the same organization'
    );
  END IF;

  -- Prevent self-modification
  IF manager_user_id = target_user_id THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Cannot modify your own role'
    );
  END IF;

  -- Only superadmin can manage roles
  IF manager_info.role != 'superadmin' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Only superadmins can change user roles'
    );
  END IF;

  -- Check if demoting current superadmin would leave organization without one
  IF target_info.role = 'superadmin' AND new_role != 'superadmin' THEN
    SELECT public.would_leave_org_without_superadmin(target_user_id, target_info.organization_id) 
    INTO would_leave_without_superadmin;
    
    IF would_leave_without_superadmin THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'Cannot demote the only superadmin. Promote another user to superadmin first.'
      );
    END IF;
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'reason', null
  );
END;
$$;

-- Add RLS policies for user management audit
ALTER TABLE public.user_management_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view all audit logs in their organization"
  ON public.user_management_audit
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can insert audit logs"
  ON public.user_management_audit
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );
