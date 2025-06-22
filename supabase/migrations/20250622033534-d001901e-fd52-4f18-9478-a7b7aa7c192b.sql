
-- Remove the duplicate project_tasks table and clean up references

-- First, drop any RLS policies on project_tasks table
DROP POLICY IF EXISTS "Users can view project tasks in their organization" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can insert project tasks in their organization" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can update project tasks in their organization" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can delete project tasks in their organization" ON public.project_tasks;

-- Drop any triggers on project_tasks
DROP TRIGGER IF EXISTS update_project_tasks_count_trigger ON public.project_tasks;
DROP TRIGGER IF EXISTS update_project_budget_spent_trigger ON public.project_tasks;

-- Update the get_user_deletion_impact function to remove project_tasks reference
CREATE OR REPLACE FUNCTION public.get_user_deletion_impact(target_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  impact_summary JSONB;
  task_count INTEGER;
  project_count INTEGER;
  chat_room_count INTEGER;
  organization_count INTEGER;
  team_member_count INTEGER;
BEGIN
  -- Count tasks assigned to user (only from tasks table now)
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
$function$;

-- Update the get_user_management_impact function to remove project_tasks reference
CREATE OR REPLACE FUNCTION public.get_user_management_impact(target_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  impact_summary JSONB;
  task_count INTEGER;
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

  -- Count tasks assigned to user (only from tasks table now)
  SELECT COUNT(*) INTO task_count
  FROM public.tasks
  WHERE assigned_to_id = target_user_id::text
  OR target_user_id::text = ANY(assigned_to_ids);

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
$function$;

-- Finally, drop the project_tasks table
DROP TABLE IF EXISTS public.project_tasks CASCADE;

-- Verify cleanup - list remaining tables to confirm project_tasks is gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%task%'
ORDER BY table_name;
