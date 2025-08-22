-- Drop and recreate functions with correct signatures
DROP FUNCTION IF EXISTS public.would_leave_org_without_superadmin(uuid, uuid);

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
  -- Get the target user's role
  SELECT role INTO target_user_role
  FROM public.users 
  WHERE id = target_user_id AND organization_id = target_org_id;
  
  -- If target user is not a superadmin, their removal won't affect superadmin count
  IF target_user_role != 'superadmin' THEN
    RETURN false;
  END IF;
  
  -- Count active superadmins in the organization (excluding the target user)
  SELECT COUNT(*) INTO superadmin_count
  FROM public.users 
  WHERE organization_id = target_org_id 
    AND role = 'superadmin'
    AND id != target_user_id;
  
  -- Return true if removing this user would leave no superadmins
  RETURN superadmin_count = 0;
END;
$function$;