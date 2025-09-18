-- Security Hardening: Basic Role Management and Hierarchy

-- 1. Create centralized role hierarchy function
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Create role validation function
CREATE OR REPLACE FUNCTION public.can_manage_user_role(
  requester_role TEXT,
  target_role TEXT,
  new_role TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  requester_level INTEGER;
  target_level INTEGER;
  new_role_level INTEGER;
BEGIN
  -- Get hierarchy levels
  SELECT hierarchy_level INTO requester_level 
  FROM public.get_role_hierarchy() WHERE role_name = requester_role;
  
  SELECT hierarchy_level INTO target_level 
  FROM public.get_role_hierarchy() WHERE role_name = target_role;
  
  SELECT hierarchy_level INTO new_role_level 
  FROM public.get_role_hierarchy() WHERE role_name = new_role;
  
  -- Return false if any role is invalid
  IF requester_level IS NULL OR target_level IS NULL OR new_role_level IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Validation rules:
  -- 1. Requester must have higher level than target
  -- 2. Requester must have higher level than new role
  -- 3. Only superadmins can manage superadmin roles
  
  IF requester_level <= target_level THEN
    RETURN FALSE;
  END IF;
  
  IF requester_level <= new_role_level THEN
    RETURN FALSE;
  END IF;
  
  IF (target_role = 'superadmin' OR new_role = 'superadmin') AND requester_role != 'superadmin' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;