
-- Add organization-wide user management enhancements
-- Add indexes for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_users_organization_role ON users(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create a function to get organization statistics
CREATE OR REPLACE FUNCTION get_organization_stats(org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM users WHERE organization_id = org_id),
    'superadmins', (SELECT COUNT(*) FROM users WHERE organization_id = org_id AND role = 'superadmin'),
    'admins', (SELECT COUNT(*) FROM users WHERE organization_id = org_id AND role = 'admin'),
    'managers', (SELECT COUNT(*) FROM users WHERE organization_id = org_id AND role = 'manager'),
    'users', (SELECT COUNT(*) FROM users WHERE organization_id = org_id AND role = 'user'),
    'active_projects', (SELECT COUNT(*) FROM projects WHERE organization_id = org_id AND status != 'Completed'),
    'total_tasks', (SELECT COUNT(*) FROM tasks WHERE organization_id = org_id),
    'completed_tasks', (SELECT COUNT(*) FROM tasks WHERE organization_id = org_id AND status = 'Completed')
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- Create a function to check if user can manage another user's role
CREATE OR REPLACE FUNCTION can_manage_user_role(manager_role TEXT, target_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Superadmin can manage everyone except other superadmins
  IF manager_role = 'superadmin' AND target_role != 'superadmin' THEN
    RETURN TRUE;
  END IF;
  
  -- Admin can manage managers and users
  IF manager_role = 'admin' AND target_role IN ('manager', 'user') THEN
    RETURN TRUE;
  END IF;
  
  -- Manager can manage users only
  IF manager_role = 'manager' AND target_role = 'user' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create a view for organization hierarchy
CREATE OR REPLACE VIEW organization_user_hierarchy AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.organization_id,
  u.created_at,
  o.name as organization_name,
  CASE 
    WHEN u.role = 'superadmin' THEN 4
    WHEN u.role = 'admin' THEN 3
    WHEN u.role = 'manager' THEN 2
    WHEN u.role = 'user' THEN 1
    ELSE 0
  END as role_level,
  (SELECT COUNT(*) FROM tasks WHERE assigned_to_id = u.id::text) as assigned_tasks_count,
  (SELECT COUNT(*) FROM tasks WHERE assigned_to_id = u.id::text AND status = 'Completed') as completed_tasks_count
FROM users u
JOIN organizations o ON u.organization_id = o.id;
