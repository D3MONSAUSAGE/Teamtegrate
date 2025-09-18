-- Security Fix: Remove problematic SECURITY DEFINER functions and improve access control

-- 1. DROP the problematic get_all_projects function that bypasses RLS
DROP FUNCTION IF EXISTS public.get_all_projects();

-- 2. Remove utility functions that don't serve a real purpose
DROP FUNCTION IF EXISTS public.create_get_all_tasks_function();
DROP FUNCTION IF EXISTS public.create_get_all_projects_function();

-- 3. Fix the set_message_reaction_org function to include proper search_path
CREATE OR REPLACE FUNCTION public.set_message_reaction_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.chat_messages cm
    WHERE cm.id = NEW.message_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Fix the set_chat_attachment_org function to include proper search_path  
CREATE OR REPLACE FUNCTION public.set_chat_attachment_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.chat_messages cm
    WHERE cm.id = NEW.message_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. Create a secure replacement for get_all_projects that respects RLS
CREATE OR REPLACE FUNCTION public.get_user_accessible_projects()
RETURNS SETOF projects
LANGUAGE sql
SECURITY INVOKER  -- Use INVOKER instead of DEFINER to respect RLS
STABLE
SET search_path TO 'public'
AS $function$
  -- This will respect RLS policies and only return projects the user can access
  SELECT * FROM projects ORDER BY created_at DESC;
$function$;

-- 6. Ensure the get_user_teams function has proper validation
CREATE OR REPLACE FUNCTION public.get_user_teams(user_id_param uuid)
RETURNS TABLE(team_id uuid, team_name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow users to get their own teams or admins to get any teams
  IF user_id_param != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Can only view your own teams';
  END IF;
  
  RETURN QUERY
  SELECT 
    tm.team_id,
    t.name as team_name,
    tm.role
  FROM public.team_memberships tm
  JOIN public.teams t ON tm.team_id = t.id
  WHERE tm.user_id = user_id_param
    AND t.is_active = true;
END;
$function$;