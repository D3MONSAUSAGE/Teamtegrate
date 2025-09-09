-- Add "Requests" permission module to access control system
-- First insert the permission module
INSERT INTO public.permission_modules (id, name, display_name, description, is_active)
VALUES (
  'requests',
  'requests', 
  'Requests Management',
  'Manage request types, assignments, and approval workflows',
  true
) ON CONFLICT (name) DO NOTHING;

-- Add permission actions for the requests module
INSERT INTO public.permission_actions (id, module_id, name, display_name, description)
VALUES 
  (gen_random_uuid(), 'requests', 'create', 'Create Requests', 'Create new requests of any type'),
  (gen_random_uuid(), 'requests', 'view', 'View Requests', 'View requests in the system'),
  (gen_random_uuid(), 'requests', 'approve', 'Approve Requests', 'Approve or reject pending requests'),
  (gen_random_uuid(), 'requests', 'manage_types', 'Manage Request Types', 'Create, edit, and delete request types'),
  (gen_random_uuid(), 'requests', 'assign_approvers', 'Assign Approvers', 'Configure who can approve specific request types')
ON CONFLICT DO NOTHING;