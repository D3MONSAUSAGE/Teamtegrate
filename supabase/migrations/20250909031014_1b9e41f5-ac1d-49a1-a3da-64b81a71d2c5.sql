-- Add "Requests" permission module to access control system
-- First insert the permission module with proper UUID
INSERT INTO public.permission_modules (name, display_name, description, is_active)
VALUES (
  'requests', 
  'Requests Management',
  'Manage request types, assignments, and approval workflows',
  true
) ON CONFLICT (name) DO NOTHING;

-- Add permission actions for the requests module
INSERT INTO public.permission_actions (module_id, name, display_name, description)
SELECT 
  pm.id,
  action_name,
  action_display,
  action_desc
FROM public.permission_modules pm
CROSS JOIN (
  VALUES 
    ('create', 'Create Requests', 'Create new requests of any type'),
    ('view', 'View Requests', 'View requests in the system'),
    ('approve', 'Approve Requests', 'Approve or reject pending requests'),
    ('manage_types', 'Manage Request Types', 'Create, edit, and delete request types'),
    ('assign_approvers', 'Assign Approvers', 'Configure who can approve specific request types')
) AS actions(action_name, action_display, action_desc)
WHERE pm.name = 'requests'
ON CONFLICT (module_id, name) DO NOTHING;