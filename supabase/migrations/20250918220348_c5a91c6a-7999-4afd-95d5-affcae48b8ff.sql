-- Security Fix: Address SECURITY DEFINER view-like functions

-- 1. Fix get_role_hierarchy - this can be SECURITY INVOKER since it's just static data
CREATE OR REPLACE FUNCTION public.get_role_hierarchy()
RETURNS TABLE(role_name TEXT, hierarchy_level INTEGER) AS $$
BEGIN
  RETURN QUERY VALUES
    ('user'::TEXT, 1),
    ('team_leader'::TEXT, 2),
    ('manager'::TEXT, 3), 
    ('admin'::TEXT, 4),
    ('superadmin'::TEXT, 5);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER STABLE SET search_path = public;

-- 2. Fix find_missing_users - add proper access control
CREATE OR REPLACE FUNCTION public.find_missing_users()
RETURNS TABLE(auth_user_id uuid, auth_email text, auth_created_at timestamp with time zone, missing_from_public boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only allow superadmins to access this function
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only superadmins can view missing users audit';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at,
    (pu.id IS NULL) as missing_from_public
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE au.email IS NOT NULL
  ORDER BY au.created_at DESC;
END;
$function$;

-- 3. Fix audit_organization_data - add proper access control  
CREATE OR REPLACE FUNCTION public.audit_organization_data()
RETURNS TABLE(table_name text, records_without_org integer, orphaned_records integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only allow superadmins to access this audit function
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only superadmins can run data audit';
  END IF;

  RETURN QUERY
  SELECT 'users'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.users WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.users WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = users.organization_id));
         
  RETURN QUERY
  SELECT 'projects'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.projects WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.projects WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = projects.organization_id));
         
  RETURN QUERY
  SELECT 'tasks'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.tasks WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.tasks WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = tasks.organization_id));
         
  RETURN QUERY
  SELECT 'comments'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.comments WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.comments WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = comments.organization_id));
         
  RETURN QUERY
  SELECT 'chat_rooms'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.chat_rooms WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.chat_rooms WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = chat_rooms.organization_id));
         
  RETURN QUERY
  SELECT 'chat_messages'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.chat_messages WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.chat_messages WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = chat_messages.organization_id));
         
  RETURN QUERY
  SELECT 'notifications'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.notifications WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.notifications WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = notifications.organization_id));
         
  RETURN QUERY
  SELECT 'documents'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.documents WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.documents WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = documents.organization_id));
         
  RETURN QUERY
  SELECT 'events'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.events WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.events WHERE organization_id IS not NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = events.organization_id));
         
  RETURN QUERY
  SELECT 'time_entries'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.time_entries WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.time_entries WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = time_entries.organization_id));
END;
$function$;