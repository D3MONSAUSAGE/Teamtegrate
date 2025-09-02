-- Phase 1: Add team_leader to role constraints and update team_memberships
-- Update users table role constraint to include team_leader
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('superadmin', 'admin', 'manager', 'team_leader', 'user'));

-- Add system_role_override to team_memberships for team-specific role overrides
ALTER TABLE public.team_memberships 
ADD COLUMN IF NOT EXISTS system_role_override text 
CHECK (system_role_override IN ('manager', 'team_leader', 'member') OR system_role_override IS NULL);

-- Phase 2: Create job roles system tables
-- Organization-scoped Job Roles (functional titles)
CREATE TABLE IF NOT EXISTS public.job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

-- User <-> Job Roles (org-level assignments)
CREATE TABLE IF NOT EXISTS public.user_job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_role_id uuid NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, job_role_id)
);

-- Team-scoped job role assignments
CREATE TABLE IF NOT EXISTS public.team_job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_role_id uuid NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id, job_role_id)
);

-- Phase 3: Add RLS policies for new tables
-- Job Roles RLS
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view job roles in their organization" 
ON public.job_roles 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create job roles" 
ON public.job_roles 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'manager')
);

CREATE POLICY "Managers can update job roles" 
ON public.job_roles 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() 
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'manager')
);

CREATE POLICY "Managers can delete job roles" 
ON public.job_roles 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() 
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'manager')
);

-- User Job Roles RLS
ALTER TABLE public.user_job_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view job role assignments in their organization" 
ON public.user_job_roles 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can assign org-level job roles" 
ON public.user_job_roles 
FOR ALL 
USING (
  organization_id = get_current_user_organization_id() 
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'manager')
) 
WITH CHECK (
  organization_id = get_current_user_organization_id() 
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'manager')
);

-- Team Job Roles RLS
ALTER TABLE public.team_job_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team job roles" 
ON public.team_job_roles 
FOR SELECT 
USING (
  team_id IN (
    SELECT t.id FROM public.teams t 
    WHERE t.organization_id = get_current_user_organization_id()
  )
);

CREATE POLICY "Team managers and leaders can assign team job roles" 
ON public.team_job_roles 
FOR ALL 
USING (
  team_id IN (
    SELECT t.id FROM public.teams t 
    JOIN public.team_memberships tm ON t.id = tm.team_id
    WHERE t.organization_id = get_current_user_organization_id()
    AND tm.user_id = auth.uid() 
    AND (tm.role = 'manager' OR tm.system_role_override IN ('manager', 'team_leader'))
  )
  OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'manager')
) 
WITH CHECK (
  team_id IN (
    SELECT t.id FROM public.teams t 
    JOIN public.team_memberships tm ON t.id = tm.team_id
    WHERE t.organization_id = get_current_user_organization_id()
    AND tm.user_id = auth.uid() 
    AND (tm.role = 'manager' OR tm.system_role_override IN ('manager', 'team_leader'))
  )
  OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('superadmin', 'admin', 'manager')
);

-- Phase 4: Create update triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_job_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_roles_updated_at
  BEFORE UPDATE ON public.job_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_roles_updated_at();

-- Phase 5: Seed default job roles for existing organizations
INSERT INTO public.job_roles (organization_id, name, description, is_active)
SELECT 
  o.id,
  roles.name,
  roles.description,
  true
FROM public.organizations o
CROSS JOIN (
  VALUES 
    ('Cook', 'Food preparation and cooking responsibilities'),
    ('Cashier', 'Point-of-sale and customer payment processing'),
    ('HR', 'Human resources and employee management'),
    ('Finance', 'Financial management and accounting'),
    ('IT', 'Information technology and system management'),
    ('Marketing', 'Marketing and promotional activities')
) AS roles(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.job_roles jr 
  WHERE jr.organization_id = o.id AND jr.name = roles.name
);