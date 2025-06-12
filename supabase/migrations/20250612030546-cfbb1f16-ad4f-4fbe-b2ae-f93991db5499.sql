
-- EMERGENCY RLS CLEANUP - SIMPLIFIED APPROACH
-- This will completely resolve the infinite recursion and access issues

-- Step 1: Emergency disable RLS on all tables to restore immediate access
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries DISABLE ROW LEVEL SECURITY;

-- Step 2: Direct policy cleanup - Drop ALL known policies explicitly
-- Projects table policies (all possible names)
DROP POLICY IF EXISTS "emergency_projects_access_2025" ON public.projects;
DROP POLICY IF EXISTS "final_projects_org_access" ON public.projects;
DROP POLICY IF EXISTS "org_isolation_projects_final" ON public.projects;
DROP POLICY IF EXISTS "projects_simple_org_isolation" ON public.projects;
DROP POLICY IF EXISTS "projects_org_isolation" ON public.projects;
DROP POLICY IF EXISTS "Projects organization isolation" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "projects_select_organization" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_organization" ON public.projects;
DROP POLICY IF EXISTS "projects_update_managers_admins" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_managers_admins" ON public.projects;

-- Tasks table policies (all possible names)
DROP POLICY IF EXISTS "emergency_tasks_access_2025" ON public.tasks;
DROP POLICY IF EXISTS "final_tasks_org_access" ON public.tasks;
DROP POLICY IF EXISTS "org_isolation_tasks_final" ON public.tasks;
DROP POLICY IF EXISTS "tasks_simple_org_isolation" ON public.tasks;
DROP POLICY IF EXISTS "tasks_org_isolation" ON public.tasks;
DROP POLICY IF EXISTS "Tasks organization isolation" ON public.tasks;
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their organization" ON public.tasks;

-- Users table policies (all possible names)
DROP POLICY IF EXISTS "emergency_users_access_2025" ON public.users;
DROP POLICY IF EXISTS "final_users_org_access" ON public.users;
DROP POLICY IF EXISTS "Users organization isolation" ON public.users;
DROP POLICY IF EXISTS "users_select_organization" ON public.users;

-- Project team members policies
DROP POLICY IF EXISTS "emergency_team_members_access_2025" ON public.project_team_members;
DROP POLICY IF EXISTS "final_team_members_org_access" ON public.project_team_members;
DROP POLICY IF EXISTS "org_isolation_team_members_final" ON public.project_team_members;

-- Other table policies
DROP POLICY IF EXISTS "emergency_comments_access_2025" ON public.comments;
DROP POLICY IF EXISTS "final_comments_org_access" ON public.comments;
DROP POLICY IF EXISTS "emergency_chat_rooms_access_2025" ON public.chat_rooms;
DROP POLICY IF EXISTS "final_chat_rooms_org_access" ON public.chat_rooms;
DROP POLICY IF EXISTS "emergency_chat_messages_access_2025" ON public.chat_messages;
DROP POLICY IF EXISTS "final_chat_messages_org_access" ON public.chat_messages;
DROP POLICY IF EXISTS "emergency_notifications_access_2025" ON public.notifications;
DROP POLICY IF EXISTS "final_notifications_org_access" ON public.notifications;
DROP POLICY IF EXISTS "emergency_documents_access_2025" ON public.documents;
DROP POLICY IF EXISTS "final_documents_org_access" ON public.documents;
DROP POLICY IF EXISTS "emergency_events_access_2025" ON public.events;
DROP POLICY IF EXISTS "final_events_org_access" ON public.events;
DROP POLICY IF EXISTS "emergency_time_entries_access_2025" ON public.time_entries;
DROP POLICY IF EXISTS "final_time_entries_org_access" ON public.time_entries;

-- Step 3: Re-enable RLS (required for policies to work)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Step 4: Create ONLY the essential clean policies (with unique names)
-- These are the ONLY policies that will exist - no more infinite recursion!

-- 1. Projects: Organization isolation only
CREATE POLICY "clean_projects_org_2025" ON public.projects
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- 2. Tasks: Organization isolation only  
CREATE POLICY "clean_tasks_org_2025" ON public.tasks
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- 3. Users: Organization isolation only
CREATE POLICY "clean_users_org_2025" ON public.users
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Step 5: Essential policies for other tables
CREATE POLICY "clean_comments_org_2025" ON public.comments
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "clean_chat_rooms_org_2025" ON public.chat_rooms
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "clean_chat_messages_org_2025" ON public.chat_messages
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "clean_notifications_org_2025" ON public.notifications
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "clean_documents_org_2025" ON public.documents
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "clean_events_org_2025" ON public.events
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "clean_time_entries_org_2025" ON public.time_entries
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Project team members: Clean organization isolation via project lookup
CREATE POLICY "clean_team_members_org_2025" ON public.project_team_members
FOR ALL USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE organization_id = public.get_current_user_organization_id()
  )
);

-- Step 6: Test that everything works
SELECT 'RLS Function Test:' as test_name, public.get_current_user_organization_id() as result;
SELECT 'Projects Access Test:' as test_name, COUNT(*)::text as result FROM public.projects;
SELECT 'Tasks Access Test:' as test_name, COUNT(*)::text as result FROM public.tasks;
SELECT 'Users Access Test:' as test_name, COUNT(*)::text as result FROM public.users;

-- Step 7: Final verification - show active policies (should be exactly 11)
SELECT 
    tablename, 
    policyname
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('projects', 'tasks', 'project_team_members', 'users', 'comments', 'chat_rooms', 'chat_messages', 'notifications', 'documents', 'events', 'time_entries')
ORDER BY tablename, policyname;
