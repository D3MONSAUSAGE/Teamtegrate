-- CRITICAL SECURITY FIX: Implement proper user roles system
-- This prevents privilege escalation by separating roles from the users table

-- Step 1: Create app_role enum with all application roles
CREATE TYPE public.app_role AS ENUM (
  'superadmin',
  'admin', 
  'manager',
  'team_leader',
  'user'
);

-- Step 2: Create user_roles table with proper constraints
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  organization_id uuid NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for user_roles table
-- Users can view roles in their organization
CREATE POLICY "Users can view roles in their organization"
ON public.user_roles
FOR SELECT
USING (organization_id = public.get_current_user_organization_id());

-- Only admins/superadmins can assign roles
CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
  AND assigned_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

-- Only admins/superadmins can remove roles
CREATE POLICY "Only admins can remove roles"
ON public.user_roles
FOR DELETE
USING (
  organization_id = public.get_current_user_organization_id()
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

-- Step 4: Create SECURITY DEFINER function to check roles
-- This prevents recursive RLS issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Helper function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'superadmin') THEN 'superadmin'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'manager') THEN 'manager'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'team_leader') THEN 'team_leader'
    ELSE 'user'
  END
$$;

-- Step 5: Migrate existing roles from users table to user_roles
-- This preserves all current role assignments
INSERT INTO public.user_roles (user_id, role, organization_id, assigned_by)
SELECT 
  u.id,
  u.role::public.app_role,
  u.organization_id,
  NULL -- No assigned_by for historical data
FROM public.users u
WHERE u.role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 6: Create audit trail for role changes
CREATE TABLE public.user_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role text,
  new_role public.app_role NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  organization_id uuid NOT NULL,
  reason text
);

ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role audit logs"
ON public.user_role_audit
FOR SELECT
USING (
  organization_id = public.get_current_user_organization_id()
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);

-- Step 7: CRITICAL - Update users table UPDATE policy to prevent role changes
-- Drop the existing update policy and recreate it without allowing role changes
DROP POLICY IF EXISTS "Users can update their own user" ON public.users;

CREATE POLICY "Users can update their own profile (not role)"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Prevent users from changing their own role
  AND (role IS NULL OR role = (SELECT role FROM public.users WHERE id = auth.uid()))
);

-- Step 8: Create trigger to keep users.role in sync with user_roles
-- This maintains backward compatibility with existing code
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When role is added/changed in user_roles, update users table
  UPDATE public.users
  SET role = public.get_user_role(NEW.user_id)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_user_role_on_insert
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role();

CREATE TRIGGER sync_user_role_on_delete
AFTER DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role();

-- Step 9: Add indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_org ON public.user_roles(organization_id);

-- Step 10: Add helpful comments
COMMENT ON TABLE public.user_roles IS 'Secure storage for user roles - prevents privilege escalation';
COMMENT ON FUNCTION public.has_role IS 'SECURITY DEFINER function to check user roles without RLS recursion';
COMMENT ON POLICY "Users can update their own profile (not role)" ON public.users IS 'Prevents users from escalating their own privileges by modifying role field';