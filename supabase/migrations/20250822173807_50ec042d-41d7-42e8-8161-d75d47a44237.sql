-- Create missing database functions for user deletion
CREATE OR REPLACE FUNCTION public.get_user_deletion_impact(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  impact_summary JSONB;
  task_count INTEGER;
  managed_projects INTEGER;
  team_member_count INTEGER;
  is_sole_superadmin BOOLEAN;
  user_info RECORD;
BEGIN
  -- Get user info
  SELECT id, email, name, role, organization_id 
  INTO user_info
  FROM public.users 
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  -- Count tasks assigned to user
  SELECT COUNT(*) INTO task_count
  FROM public.tasks
  WHERE assigned_to_id = target_user_id::text 
    OR user_id = target_user_id::text
    OR target_user_id::text = ANY(assigned_to_ids);

  -- Count projects managed by user
  SELECT COUNT(*) INTO managed_projects
  FROM public.projects
  WHERE manager_id = target_user_id::text;

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
      'role', user_info.role,
      'organization_id', user_info.organization_id
    ),
    'impact_counts', jsonb_build_object(
      'assigned_tasks', task_count,
      'managed_projects', managed_projects,
      'team_memberships', team_member_count
    ),
    'is_sole_admin', is_sole_superadmin,
    'deletion_safe', NOT is_sole_superadmin
  );

  RETURN impact_summary;
END;
$$;

-- Create function to check if deletion would leave organization without superadmin
CREATE OR REPLACE FUNCTION public.would_leave_org_without_superadmin(target_user_id uuid, target_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  superadmin_count INTEGER;
  target_user_role TEXT;
BEGIN
  -- Get the target user's role
  SELECT role INTO target_user_role
  FROM public.users
  WHERE id = target_user_id AND organization_id = target_org_id;
  
  -- If user is not superadmin, deletion won't affect superadmin count
  IF target_user_role != 'superadmin' THEN
    RETURN FALSE;
  END IF;
  
  -- Count superadmins in the organization (excluding the target user)
  SELECT COUNT(*) INTO superadmin_count
  FROM public.users
  WHERE organization_id = target_org_id 
    AND role = 'superadmin'
    AND id != target_user_id;
  
  -- Return true if this would leave organization without superadmin
  RETURN superadmin_count = 0;
END;
$$;