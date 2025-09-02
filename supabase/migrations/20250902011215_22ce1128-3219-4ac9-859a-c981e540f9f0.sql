-- Create permission system tables
CREATE TABLE public.permission_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create permission actions table
CREATE TABLE public.permission_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL REFERENCES public.permission_modules(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(module_id, name)
);

-- Create role permissions table
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL,
  module_id uuid NOT NULL REFERENCES public.permission_modules(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES public.permission_actions(id) ON DELETE CASCADE,
  granted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, role, module_id, action_id)
);

-- Create job role permissions table
CREATE TABLE public.job_role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_role_id uuid NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.permission_modules(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES public.permission_actions(id) ON DELETE CASCADE,
  granted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, job_role_id, module_id, action_id)
);

-- Create user permission overrides table
CREATE TABLE public.user_permission_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.permission_modules(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES public.permission_actions(id) ON DELETE CASCADE,
  granted boolean NOT NULL DEFAULT false,
  granted_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id, module_id, action_id)
);

-- Create permission audit log table
CREATE TABLE public.permission_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES public.users(id),
  target_user_id uuid REFERENCES public.users(id),
  target_role text,
  target_job_role_id uuid REFERENCES public.job_roles(id),
  module_id uuid NOT NULL REFERENCES public.permission_modules(id),
  action_id uuid NOT NULL REFERENCES public.permission_actions(id),
  old_value boolean,
  new_value boolean NOT NULL,
  change_type text NOT NULL, -- 'role', 'job_role', 'user_override'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all permission tables
ALTER TABLE public.permission_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permission_modules (global read, admin write)
CREATE POLICY "Everyone can view permission modules" 
ON public.permission_modules FOR SELECT USING (true);

CREATE POLICY "Superadmins can manage permission modules" 
ON public.permission_modules FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND role = 'superadmin'
));

-- RLS Policies for permission_actions (global read, admin write)
CREATE POLICY "Everyone can view permission actions" 
ON public.permission_actions FOR SELECT USING (true);

CREATE POLICY "Superadmins can manage permission actions" 
ON public.permission_actions FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND role = 'superadmin'
));

-- RLS Policies for role_permissions
CREATE POLICY "Users can view role permissions in their org" 
ON public.role_permissions FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Superadmins can manage role permissions" 
ON public.role_permissions FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- RLS Policies for job_role_permissions  
CREATE POLICY "Users can view job role permissions in their org" 
ON public.job_role_permissions FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Superadmins can manage job role permissions" 
ON public.job_role_permissions FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- RLS Policies for user_permission_overrides
CREATE POLICY "Users can view permission overrides in their org" 
ON public.user_permission_overrides FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Superadmins can manage user permission overrides" 
ON public.user_permission_overrides FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- RLS Policies for permission_audit_log
CREATE POLICY "Admins can view permission audit logs" 
ON public.permission_audit_log FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
  )
);

CREATE POLICY "System can insert permission audit logs" 
ON public.permission_audit_log FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  changed_by = auth.uid()
);

-- Insert default permission modules
INSERT INTO public.permission_modules (name, display_name, description) VALUES
('projects', 'Projects', 'Manage project creation, editing, and viewing'),
('tasks', 'Tasks', 'Manage task assignment, editing, and completion'),
('chat', 'Chat & Communication', 'Access chat rooms and messaging features'),
('documents', 'Documents', 'Upload, view, and manage documents'),
('finance', 'Finance', 'Manage transactions, invoices, and financial data'),
('reports', 'Reports & Analytics', 'View reports and analytics dashboards'),
('users', 'User Management', 'Manage organization users and roles'),
('teams', 'Team Management', 'Manage teams and team assignments'),
('settings', 'Organization Settings', 'Modify organization settings and configuration');

-- Insert default permission actions for each module
INSERT INTO public.permission_actions (module_id, name, display_name, description)
SELECT 
  pm.id,
  action.name,
  action.display_name,
  action.description
FROM public.permission_modules pm
CROSS JOIN (
  VALUES 
    ('create', 'Create', 'Create new items'),
    ('read', 'Read/View', 'View existing items'),
    ('update', 'Update/Edit', 'Modify existing items'),
    ('delete', 'Delete', 'Remove items'),
    ('manage', 'Full Management', 'Complete administrative control')
) AS action(name, display_name, description);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_permission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW EXECUTE FUNCTION public.update_permission_updated_at();

CREATE TRIGGER update_job_role_permissions_updated_at
BEFORE UPDATE ON public.job_role_permissions
FOR EACH ROW EXECUTE FUNCTION public.update_permission_updated_at();

CREATE TRIGGER update_user_permission_overrides_updated_at
BEFORE UPDATE ON public.user_permission_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_permission_updated_at();