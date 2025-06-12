
-- Phase 5: Data Migration & Cleanup - Ensure all data has proper organization assignment

-- 1. Audit and fix any users without organization_id
UPDATE public.users 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Legacy Org' LIMIT 1
)
WHERE organization_id IS NULL;

-- 2. Audit and fix projects without organization_id
UPDATE public.projects 
SET organization_id = (
  SELECT organization_id FROM public.users WHERE id::text = projects.manager_id LIMIT 1
)
WHERE organization_id IS NULL AND manager_id IS NOT NULL;

-- For projects without a valid manager, assign to Legacy Org
UPDATE public.projects 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Legacy Org' LIMIT 1
)
WHERE organization_id IS NULL;

-- 3. Audit and fix tasks without organization_id
UPDATE public.tasks 
SET organization_id = (
  SELECT organization_id FROM public.users WHERE id::text = tasks.user_id LIMIT 1
)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

-- For tasks without a valid user, try to get from project
UPDATE public.tasks 
SET organization_id = (
  SELECT organization_id FROM public.projects WHERE id = tasks.project_id LIMIT 1
)
WHERE organization_id IS NULL AND project_id IS NOT NULL;

-- For remaining tasks without organization, assign to Legacy Org
UPDATE public.tasks 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Legacy Org' LIMIT 1
)
WHERE organization_id IS NULL;

-- 4. Audit and fix comments without organization_id
UPDATE public.comments 
SET organization_id = (
  SELECT organization_id FROM public.users WHERE id = comments.user_id LIMIT 1
)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

-- For comments without valid user, assign to Legacy Org
UPDATE public.comments 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Legacy Org' LIMIT 1
)
WHERE organization_id IS NULL;

-- 5. Audit and fix chat rooms without organization_id
UPDATE public.chat_rooms 
SET organization_id = (
  SELECT organization_id FROM public.users WHERE id = chat_rooms.created_by LIMIT 1
)
WHERE organization_id IS NULL AND created_by IS NOT NULL;

-- For chat rooms without valid creator, assign to Legacy Org
UPDATE public.chat_rooms 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Legacy Org' LIMIT 1
)
WHERE organization_id IS NULL;

-- 6. Audit and fix chat messages without organization_id
UPDATE public.chat_messages 
SET organization_id = (
  SELECT organization_id FROM public.chat_rooms WHERE id = chat_messages.room_id LIMIT 1
)
WHERE organization_id IS NULL AND room_id IS NOT NULL;

-- For messages without valid room, assign to Legacy Org
UPDATE public.chat_messages 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Legacy Org' LIMIT 1
)
WHERE organization_id IS NULL;

-- 7. Audit and fix notifications without organization_id
UPDATE public.notifications 
SET organization_id = (
  SELECT organization_id FROM public.users WHERE id = notifications.user_id LIMIT 1
)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

-- For notifications without valid user, assign to Legacy Org
UPDATE public.notifications 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Legacy Org' LIMIT 1
)
WHERE organization_id IS NULL;

-- 8. Audit and fix documents without organization_id
UPDATE public.documents 
SET organization_id = (
  SELECT organization_id FROM public.users WHERE id = documents.user_id LIMIT 1
)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

-- For documents without valid user, assign to Legacy Org
UPDATE public.documents 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Legacy Org' LIMIT 1
)
WHERE organization_id IS NULL;

-- 9. Audit and fix events without organization_id
UPDATE public.events 
SET organization_id = (
  SELECT organization_id FROM public.users WHERE id = events.user_id LIMIT 1
)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

-- For events without valid user, assign to Legacy Org
UPDATE public.events 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Legacy Org' LIMIT 1
)
WHERE organization_id IS NULL;

-- 10. Audit and fix time entries without organization_id
UPDATE public.time_entries 
SET organization_id = (
  SELECT organization_id FROM public.users WHERE id = time_entries.user_id LIMIT 1
)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

-- For time entries without valid user, assign to Legacy Org
UPDATE public.time_entries 
SET organization_id = (
  SELECT id FROM public.organizations WHERE name = 'Legacy Org' LIMIT 1
)
WHERE organization_id IS NULL;

-- 11. Create data audit function to check for orphaned records
CREATE OR REPLACE FUNCTION public.audit_organization_data()
RETURNS TABLE(
  table_name TEXT,
  records_without_org INTEGER,
  orphaned_records INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'users'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.users WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.users WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = users.organization_id));
         
  RETURN QUERY
  SELECT 'projects'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.projects WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.projects WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = projects.organization_id));
         
  RETURN QUERY
  SELECT 'tasks'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.tasks WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.tasks WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = tasks.organization_id));
         
  RETURN QUERY
  SELECT 'comments'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.comments WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.comments WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = comments.organization_id));
         
  RETURN QUERY
  SELECT 'chat_rooms'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.chat_rooms WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.chat_rooms WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = chat_rooms.organization_id));
         
  RETURN QUERY
  SELECT 'chat_messages'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.chat_messages WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.chat_messages WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = chat_messages.organization_id));
         
  RETURN QUERY
  SELECT 'notifications'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.notifications WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.notifications WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = notifications.organization_id));
         
  RETURN QUERY
  SELECT 'documents'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.documents WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.documents WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = documents.organization_id));
         
  RETURN QUERY
  SELECT 'events'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.events WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.events WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = events.organization_id));
         
  RETURN QUERY
  SELECT 'time_entries'::TEXT, 
         (SELECT COUNT(*)::INTEGER FROM public.time_entries WHERE organization_id IS NULL),
         (SELECT COUNT(*)::INTEGER FROM public.time_entries WHERE organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = time_entries.organization_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
