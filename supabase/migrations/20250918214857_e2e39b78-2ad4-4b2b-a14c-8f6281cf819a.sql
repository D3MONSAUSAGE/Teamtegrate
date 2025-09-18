-- Security Hardening: Phase 2 - Critical RLS and Role Management Fixes

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

-- 2. Fix user update policy to prevent unauthorized role changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can update own profile except role" ON public.users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent role changes through regular update - role can only be changed by admins
  (OLD.role = NEW.role OR NEW.role IS NULL)
);

-- 3. Add audit logging for role changes
CREATE OR REPLACE FUNCTION public.audit_role_change() RETURNS TRIGGER AS $$
BEGIN
  -- Only log actual role changes
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
      COALESCE(auth.uid(), NEW.id), -- Use auth.uid() if available, otherwise the user being changed
      'user_role_change',
      NEW.id,
      'role_updated',
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user_id', NEW.id,
        'changed_by', auth.uid()
      ),
      '0.0.0.0'::inet,
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS audit_user_role_changes ON public.users;

-- Create the audit trigger
CREATE TRIGGER audit_user_role_changes
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_change();

-- 4. Strengthen existing functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 5. Create role validation function for consistent authorization checks
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