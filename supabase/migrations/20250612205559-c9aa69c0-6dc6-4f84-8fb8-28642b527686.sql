
-- Check if the user exists in auth.users table
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data,
    last_sign_in_at,
    confirmation_sent_at
FROM auth.users 
WHERE email = 'generalmanager@guanatostacos.com';

-- Check if the user exists in public.users table
SELECT 
    id,
    email,
    name,
    role,
    organization_id,
    created_at
FROM public.users 
WHERE email = 'generalmanager@guanatostacos.com';

-- Get Legacy organization info
SELECT 
    id,
    name,
    created_by,
    created_at
FROM public.organizations 
WHERE name = 'Legacy Org';

-- Check all projects in Legacy organization
SELECT 
    p.id,
    p.title,
    p.description,
    p.manager_id,
    p.status,
    p.created_at,
    p.organization_id,
    u.name as manager_name
FROM public.projects p
LEFT JOIN public.users u ON p.manager_id = u.id::text
WHERE p.organization_id = (SELECT id FROM public.organizations WHERE name = 'Legacy Org');

-- Check all tasks for this specific user
SELECT 
    t.id,
    t.title,
    t.description,
    t.user_id,
    t.assigned_to_id,
    t.project_id,
    t.status,
    t.priority,
    t.created_at,
    t.organization_id
FROM public.tasks t
WHERE t.user_id = (SELECT id::text FROM public.users WHERE email = 'generalmanager@guanatostacos.com')
   OR t.assigned_to_id = (SELECT id::text FROM public.users WHERE email = 'generalmanager@guanatostacos.com')
   OR (SELECT id::text FROM public.users WHERE email = 'generalmanager@guanatostacos.com') = ANY(t.assigned_to_ids);

-- Check all tasks in Legacy organization
SELECT 
    t.id,
    t.title,
    t.description,
    t.user_id,
    t.assigned_to_id,
    t.project_id,
    t.status,
    t.priority,
    t.created_at,
    u.name as assigned_user_name
FROM public.tasks t
LEFT JOIN public.users u ON t.assigned_to_id = u.id::text
WHERE t.organization_id = (SELECT id FROM public.organizations WHERE name = 'Legacy Org');

-- Check project team memberships for this user
SELECT 
    ptm.id,
    ptm.project_id,
    ptm.user_id,
    ptm.created_at,
    p.title as project_title
FROM public.project_team_members ptm
LEFT JOIN public.projects p ON ptm.project_id = p.id
WHERE ptm.user_id = (SELECT id FROM public.users WHERE email = 'generalmanager@guanatostacos.com');

-- Check user's login attempts and potential issues
SELECT 
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    banned_until,
    confirmation_token IS NOT NULL as has_confirmation_token
FROM auth.users 
WHERE email = 'generalmanager@guanatostacos.com';
