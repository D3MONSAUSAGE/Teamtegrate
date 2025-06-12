
-- Check if the user already exists in both auth.users and public.users
SELECT 
    'auth.users' as table_name,
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    raw_user_meta_data->>'name' as name
FROM auth.users 
WHERE email = 'generalmanager@guanatostacos.com'

UNION ALL

SELECT 
    'public.users' as table_name,
    id,
    email,
    true as email_confirmed,
    name
FROM public.users 
WHERE email = 'generalmanager@guanatostacos.com';

-- If user exists in auth but not in public.users, we can add them to public.users
-- If user exists in public.users, check their current role and organization
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.organization_id,
    o.name as organization_name
FROM public.users u
LEFT JOIN public.organizations o ON u.organization_id = o.id
WHERE u.email = 'generalmanager@guanatostacos.com';
