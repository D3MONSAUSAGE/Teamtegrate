-- Security Hardening: Phase 1 - Critical Database Fixes

-- 1. Secure permission system tables - add proper RLS policies
ALTER TABLE public.permission_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_actions ENABLE ROW LEVEL SECURITY;

-- Add policies to restrict access to permission tables
CREATE POLICY "Authenticated users can view permission modules" ON public.permission_modules
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage permission modules" ON public.permission_modules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
    AND organization_id = permission_modules.organization_id
  )
);

CREATE POLICY "Authenticated users can view permission actions" ON public.permission_actions  
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage permission actions" ON public.permission_actions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

-- 2. Create centralized role hierarchy function to prevent inconsistencies
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

-- 3. Create secure role validation function
CREATE OR REPLACE FUNCTION public.can_change_user_role(
  requester_id UUID,
  target_user_id UUID, 
  new_role TEXT,
  organization_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  requester_role TEXT;
  target_role TEXT;
  requester_level INTEGER;
  target_level INTEGER;
  new_role_level INTEGER;
BEGIN
  -- Get requester role and validate organization
  SELECT role INTO requester_role
  FROM public.users 
  WHERE id = requester_id AND users.organization_id = can_change_user_role.organization_id;
  
  IF requester_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get target user role and validate same organization
  SELECT role INTO target_role
  FROM public.users 
  WHERE id = target_user_id AND users.organization_id = can_change_user_role.organization_id;
  
  IF target_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get hierarchy levels
  SELECT hierarchy_level INTO requester_level 
  FROM public.get_role_hierarchy() WHERE role_name = requester_role;
  
  SELECT hierarchy_level INTO target_level 
  FROM public.get_role_hierarchy() WHERE role_name = target_role;
  
  SELECT hierarchy_level INTO new_role_level 
  FROM public.get_role_hierarchy() WHERE role_name = new_role;
  
  -- Validation rules:
  -- 1. Requester must have higher level than target
  -- 2. Requester must have higher level than new role (can't promote above themselves)
  -- 3. Only superadmins can change superadmin roles
  -- 4. Can't demote the last superadmin in organization
  
  IF requester_level <= target_level THEN
    RETURN FALSE;
  END IF;
  
  IF requester_level <= new_role_level THEN
    RETURN FALSE;
  END IF;
  
  IF target_role = 'superadmin' AND requester_role != 'superadmin' THEN
    RETURN FALSE;
  END IF;
  
  IF new_role = 'superadmin' AND requester_role != 'superadmin' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if demoting last superadmin
  IF target_role = 'superadmin' AND new_role != 'superadmin' THEN
    IF (SELECT COUNT(*) FROM public.users 
        WHERE role = 'superadmin' 
        AND users.organization_id = can_change_user_role.organization_id 
        AND id != target_user_id) = 0 THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Strengthen user update policies to prevent unauthorized role changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile except role" ON public.users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent role changes through regular update
  (OLD.role = NEW.role OR NEW.role IS NULL)
);

-- 5. Add audit logging for role changes
CREATE OR REPLACE FUNCTION public.audit_role_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.compliance_audit_logs (
      organization_id,
      user_id,
      entity_type,
      entity_id,
      action,
      changes,
      ip_address,
      user_agent
    ) VALUES (
      NEW.organization_id,
      auth.uid(),
      'user_role_change',
      NEW.id,
      'role_updated',
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user_id', NEW.id
      ),
      '0.0.0.0'::inet,
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_user_role_changes
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_change();

-- 6. Fix search_path issues in existing functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 7. Add RLS policy validation function
CREATE OR REPLACE FUNCTION public.validate_organization_access()
RETURNS UUID AS $$
DECLARE
  user_org_id UUID;
BEGIN
  SELECT organization_id INTO user_org_id 
  FROM public.users 
  WHERE id = auth.uid();
  
  IF user_org_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not associated with an organization';
  END IF;
  
  RETURN user_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;