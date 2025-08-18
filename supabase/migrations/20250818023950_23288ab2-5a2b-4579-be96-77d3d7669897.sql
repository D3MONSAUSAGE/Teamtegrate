-- CRITICAL SECURITY FIXES - Phase 2: Fix Remaining Function Search Paths

-- Update all remaining functions to include search_path security protection
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.users WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.user_is_project_member(project_id text, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_team_members 
    WHERE project_id = $1 AND user_id = $2
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_is_project_creator(project_id text, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects 
    WHERE id = $1 AND manager_id = $2::text
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_is_project_team_member(project_id_val text, user_id_val uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_team_members 
    WHERE project_id = project_id_val AND user_id = user_id_val
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_is_admin_or_superadmin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id 
    AND role IN ('admin', 'superadmin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_user_role(manager_role text, target_role text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  IF manager_role = 'superadmin' AND target_role != 'superadmin' THEN
    RETURN TRUE;
  END IF;
  
  IF manager_role = 'admin' AND target_role IN ('manager', 'user') THEN
    RETURN TRUE;
  END IF;
  
  IF manager_role = 'manager' AND target_role = 'user' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.would_leave_org_without_superadmin(target_user_id uuid, target_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  superadmin_count INTEGER;
  target_user_role TEXT;
BEGIN
  SELECT role INTO target_user_role
  FROM public.users
  WHERE id = target_user_id AND organization_id = target_org_id;
  
  IF target_user_role != 'superadmin' THEN
    RETURN FALSE;
  END IF;
  
  SELECT COUNT(*) INTO superadmin_count
  FROM public.users
  WHERE organization_id = target_org_id 
    AND role = 'superadmin' 
    AND id != target_user_id;
  
  RETURN superadmin_count = 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_user_access_project(project_id_param text, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role TEXT;
  user_org_id UUID;
  project_manager_id TEXT;
  project_org_id UUID;
  project_team_members UUID[];
BEGIN
  SELECT role, organization_id INTO user_role, user_org_id
  FROM public.users 
  WHERE id = user_id_param;
  
  SELECT manager_id, organization_id, team_members 
  INTO project_manager_id, project_org_id, project_team_members
  FROM public.projects 
  WHERE id = project_id_param;
  
  IF user_org_id != project_org_id THEN
    RETURN FALSE;
  END IF;
  
  IF user_role IN ('admin', 'superadmin') THEN
    RETURN TRUE;
  END IF;
  
  IF project_manager_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  IF project_team_members IS NOT NULL AND user_id_param = ANY(project_team_members) THEN
    RETURN TRUE;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.project_team_members 
    WHERE project_id = project_id_param 
    AND user_id = user_id_param
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_user_access_task(task_id_param text, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role TEXT;
  user_org_id UUID;
  task_user_id TEXT;
  task_assigned_to_id TEXT;
  task_assigned_to_ids TEXT[];
  task_org_id UUID;
BEGIN
  SELECT role, organization_id INTO user_role, user_org_id
  FROM public.users 
  WHERE id = user_id_param;
  
  SELECT user_id, assigned_to_id, assigned_to_ids, organization_id 
  INTO task_user_id, task_assigned_to_id, task_assigned_to_ids, task_org_id
  FROM public.tasks 
  WHERE id = task_id_param;
  
  IF user_org_id != task_org_id THEN
    RETURN FALSE;
  END IF;
  
  IF user_role IN ('admin', 'superadmin') THEN
    RETURN TRUE;
  END IF;
  
  IF user_role = 'manager' THEN
    RETURN TRUE;
  END IF;
  
  IF task_user_id IS NOT NULL AND task_user_id != '' AND task_user_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  IF task_assigned_to_id IS NOT NULL AND task_assigned_to_id != '' AND task_assigned_to_id = user_id_param::text THEN
    RETURN TRUE;
  END IF;
  
  IF task_assigned_to_ids IS NOT NULL AND array_length(task_assigned_to_ids, 1) > 0 THEN
    IF EXISTS (
      SELECT 1 
      FROM unnest(task_assigned_to_ids) AS assigned_id 
      WHERE assigned_id IS NOT NULL 
        AND assigned_id != '' 
        AND assigned_id = user_id_param::text
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Fix validation function search path
CREATE OR REPLACE FUNCTION public.validate_assigned_to_ids(ids text[])
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  IF ids IS NULL THEN
    RETURN TRUE;
  END IF;
  
  IF '' = ANY(ids) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- Fix organization utilities
CREATE OR REPLACE FUNCTION public.set_organization_id_from_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := (SELECT organization_id FROM public.users WHERE id = auth.uid());
  END IF;
  
  RETURN NEW;
END;
$function$;