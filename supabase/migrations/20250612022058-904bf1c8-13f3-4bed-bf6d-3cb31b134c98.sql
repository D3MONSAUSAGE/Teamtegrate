
-- Move all users from the empty organization to the organization with data
UPDATE public.users 
SET organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
WHERE organization_id = '5f247283-3910-431f-bcca-3f2f9e4861a1';

-- Move all comments from the empty organization to the organization with data
UPDATE public.comments 
SET organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
WHERE organization_id = '5f247283-3910-431f-bcca-3f2f9e4861a1';

-- Move any other data that might be referencing the empty organization
UPDATE public.tasks 
SET organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
WHERE organization_id = '5f247283-3910-431f-bcca-3f2f9e4861a1';

UPDATE public.projects 
SET organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
WHERE organization_id = '5f247283-3910-431f-bcca-3f2f9e4861a1';

UPDATE public.chat_rooms 
SET organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
WHERE organization_id = '5f247283-3910-431f-bcca-3f2f9e4861a1';

UPDATE public.chat_messages 
SET organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
WHERE organization_id = '5f247283-3910-431f-bcca-3f2f9e4861a1';

UPDATE public.notifications 
SET organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
WHERE organization_id = '5f247283-3910-431f-bcca-3f2f9e4861a1';

UPDATE public.documents 
SET organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
WHERE organization_id = '5f247283-3910-431f-bcca-3f2f9e4861a1';

UPDATE public.events 
SET organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
WHERE organization_id = '5f247283-3910-431f-bcca-3f2f9e4861a1';

UPDATE public.time_entries 
SET organization_id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
WHERE organization_id = '5f247283-3910-431f-bcca-3f2f9e4861a1';

-- Now delete the empty organization (all references should be moved)
DELETE FROM public.organizations 
WHERE id = '5f247283-3910-431f-bcca-3f2f9e4861a1';

-- Verify the migration worked by checking user count in the data organization
SELECT 
    o.name as organization_name,
    COUNT(u.id) as user_count
FROM public.organizations o
LEFT JOIN public.users u ON o.id = u.organization_id
WHERE o.id = 'a15218f7-9da3-440a-a985-2c65bcb86a08'
GROUP BY o.id, o.name;
