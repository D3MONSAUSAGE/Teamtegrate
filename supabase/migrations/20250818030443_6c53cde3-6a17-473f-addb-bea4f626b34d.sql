-- CRITICAL SECURITY FIXES - Phase 3: Fix All Remaining Function Search Paths

-- Fix all remaining functions without search_path protection
CREATE OR REPLACE FUNCTION public.generate_invoice_file_path(org_id uuid, user_id uuid, filename text)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN org_id::text || '/invoices/' || EXTRACT(epoch FROM NOW())::bigint || '-' || 
         regexp_replace(filename, '[^a-zA-Z0-9.-]', '_', 'g');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_project_comment_stats(project_id_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_comments', COUNT(*),
        'recent_comments', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
        'pinned_comments', COUNT(*) FILTER (WHERE is_pinned = true),
        'categories', json_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL)
    ) INTO stats
    FROM comments 
    WHERE project_id = project_id_param 
    AND organization_id = get_current_user_organization_id();
    
    RETURN stats;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_sole_admin_anywhere(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count
  FROM public.organizations o
  WHERE o.created_by = target_user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.role IN ('admin', 'superadmin') 
    AND u.id != target_user_id
  );
  
  RETURN org_count > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.debug_auth_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  auth_uid UUID;
  user_exists BOOLEAN;
  user_org_id UUID;
  result JSON;
BEGIN
  auth_uid := auth.uid();
  
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = auth_uid) INTO user_exists;
  
  IF user_exists THEN
    SELECT organization_id INTO user_org_id FROM public.users WHERE id = auth_uid;
  END IF;
  
  result := json_build_object(
    'auth_uid', auth_uid,
    'user_exists_in_users_table', user_exists,
    'user_organization_id', user_org_id,
    'current_timestamp', now()
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_invite_code_with_role(org_id uuid, created_by_id uuid, invited_role text DEFAULT 'user'::text, invited_team_id uuid DEFAULT NULL::uuid, expires_days integer DEFAULT 7, max_uses_param integer DEFAULT NULL::integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  random_part TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = created_by_id 
    AND organization_id = org_id 
    AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can generate invite codes';
  END IF;
  
  IF invited_role NOT IN ('user', 'manager', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;
  
  IF invited_team_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = invited_team_id 
      AND organization_id = org_id 
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Invalid team specified';
    END IF;
  END IF;
  
  LOOP
    random_part := upper(substring(md5(random()::text || extract(epoch from now())::text) from 1 for 8));
    new_code := random_part;
    
    new_code := replace(new_code, '0', 'X');
    new_code := replace(new_code, 'O', 'Y');
    new_code := replace(new_code, '1', 'Z');
    new_code := replace(new_code, 'I', 'W');
    
    SELECT EXISTS(SELECT 1 FROM public.organization_invites WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  INSERT INTO public.organization_invites (
    organization_id, 
    invite_code, 
    created_by, 
    expires_at, 
    max_uses,
    invited_role,
    invited_team_id
  ) VALUES (
    org_id, 
    new_code, 
    created_by_id, 
    now() + (expires_days || ' days')::interval,
    max_uses_param,
    invited_role,
    invited_team_id
  );
  
  RETURN new_code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_organization_stats(org_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM users WHERE organization_id = org_id),
    'superadmins', (SELECT COUNT(*) FROM users WHERE organization_id = org_id AND role = 'superadmin'),
    'admins', (SELECT COUNT(*) FROM users WHERE organization_id = org_id AND role = 'admin'),
    'managers', (SELECT COUNT(*) FROM users WHERE organization_id = org_id AND role = 'manager'),
    'users', (SELECT COUNT(*) FROM users WHERE organization_id = org_id AND role = 'user'),
    'active_projects', (SELECT COUNT(*) FROM projects WHERE organization_id = org_id AND status != 'Completed'),
    'total_tasks', (SELECT COUNT(*) FROM tasks WHERE organization_id = org_id),
    'completed_tasks', (SELECT COUNT(*) FROM tasks WHERE organization_id = org_id AND status = 'Completed')
  ) INTO stats;
  
  RETURN stats;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_deletion_impact(target_user_id uuid)
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
  SELECT id, email, name, role, organization_id INTO user_info
  FROM public.users
  WHERE id = target_user_id;

  SELECT COUNT(*) INTO task_count
  FROM public.tasks
  WHERE assigned_to_id = target_user_id::text
  OR target_user_id::text = ANY(assigned_to_ids);

  SELECT COUNT(*) INTO managed_projects
  FROM public.projects
  WHERE manager_id = target_user_id::text;

  SELECT COUNT(*) INTO chat_room_count
  FROM public.chat_rooms
  WHERE created_by = target_user_id;

  SELECT COUNT(*) INTO team_member_count
  FROM public.project_team_members
  WHERE user_id = target_user_id;

  SELECT public.would_leave_org_without_superadmin(target_user_id, user_info.organization_id) INTO is_sole_superadmin;

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
  SELECT id, email, name, role, organization_id INTO user_info
  FROM public.users
  WHERE id = target_user_id;

  SELECT COUNT(*) INTO task_count
  FROM public.tasks
  WHERE assigned_to_id = target_user_id::text
  OR target_user_id::text = ANY(assigned_to_ids);

  SELECT COUNT(*) INTO managed_projects
  FROM public.projects
  WHERE manager_id = target_user_id::text;

  SELECT COUNT(*) INTO chat_room_count
  FROM public.chat_rooms
  WHERE created_by = target_user_id;

  SELECT COUNT(*) INTO team_member_count
  FROM public.project_team_members
  WHERE user_id = target_user_id;

  SELECT public.would_leave_org_without_superadmin(target_user_id, user_info.organization_id) INTO is_sole_superadmin;

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