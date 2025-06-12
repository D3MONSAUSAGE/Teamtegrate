
-- Complete RLS Reset Plan: Nuclear cleanup and fresh start

-- Step 1: Temporarily disable RLS on all problematic tables
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

-- Step 2: Nuclear policy cleanup - Drop ALL existing policies (60+ of them)
-- This comprehensive list covers all possible policy variations that might exist

-- Projects table policies (all variations)
DROP POLICY IF EXISTS "org_isolation_projects_final" ON public.projects;
DROP POLICY IF EXISTS "projects_simple_org_isolation" ON public.projects;
DROP POLICY IF EXISTS "projects_org_isolation" ON public.projects;
DROP POLICY IF EXISTS "Projects organization isolation" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Users can access projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Managers can view projects they manage" ON public.projects;
DROP POLICY IF EXISTS "Team members can view projects they're assigned to" ON public.projects;
DROP POLICY IF EXISTS "Project managers can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Project team members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view organization projects" ON public.projects;
DROP POLICY IF EXISTS "Users can modify organization projects" ON public.projects;
DROP POLICY IF EXISTS "Organization members can access projects" ON public.projects;
DROP POLICY IF EXISTS "Project access control" ON public.projects;
DROP POLICY IF EXISTS "Project visibility" ON public.projects;
DROP POLICY IF EXISTS "projects_select_organization" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_organization" ON public.projects;
DROP POLICY IF EXISTS "projects_update_managers_admins" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_managers_admins" ON public.projects;
DROP POLICY IF EXISTS "projects_select_organization_v2" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_organization_v2" ON public.projects;
DROP POLICY IF EXISTS "projects_update_managers_team_admins_v2" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_managers_admins_v2" ON public.projects;

-- Tasks table policies (all variations)
DROP POLICY IF EXISTS "org_isolation_tasks_final" ON public.tasks;
DROP POLICY IF EXISTS "tasks_simple_org_isolation" ON public.tasks;
DROP POLICY IF EXISTS "tasks_org_isolation" ON public.tasks;
DROP POLICY IF EXISTS "Tasks organization isolation" ON public.tasks;
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Users can access tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Task creators can manage their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Assigned users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task assignment access" ON public.tasks;
DROP POLICY IF EXISTS "Organization task access" ON public.tasks;
DROP POLICY IF EXISTS "Task visibility control" ON public.tasks;
DROP POLICY IF EXISTS "User task permissions" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_organization" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_organization" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_creators_assignees_admins" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_creators_admins" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_organization_v2" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_organization_v2" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_creators_assigned_managers_admins_v2" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_creators_managers_admins_v2" ON public.tasks;

-- Project team members policies (all variations)
DROP POLICY IF EXISTS "org_isolation_team_members_final" ON public.project_team_members;
DROP POLICY IF EXISTS "project_team_members_simple_org_isolation" ON public.project_team_members;
DROP POLICY IF EXISTS "project_team_members_org_isolation" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can view team members in their organization" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can add team members in their organization" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can remove team members in their organization" ON public.project_team_members;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.project_team_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.project_team_members;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.project_team_members;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.project_team_members;
DROP POLICY IF EXISTS "Project managers can manage team members" ON public.project_team_members;
DROP POLICY IF EXISTS "Team members can view project membership" ON public.project_team_members;
DROP POLICY IF EXISTS "Team membership access" ON public.project_team_members;
DROP POLICY IF EXISTS "Project team visibility" ON public.project_team_members;

-- Users table policies (all variations)
DROP POLICY IF EXISTS "Users organization isolation" ON public.users;
DROP POLICY IF EXISTS "users_select_organization" ON public.users;
DROP POLICY IF EXISTS "users_insert_system_only" ON public.users;
DROP POLICY IF EXISTS "users_update_self_and_admins" ON public.users;
DROP POLICY IF EXISTS "users_delete_superadmins_only" ON public.users;
DROP POLICY IF EXISTS "Users can view users in their organization" ON public.users;
DROP POLICY IF EXISTS "Users can insert users in their organization" ON public.users;
DROP POLICY IF EXISTS "Users can update users in their organization" ON public.users;
DROP POLICY IF EXISTS "Users can delete users in their organization" ON public.users;
DROP POLICY IF EXISTS "Org isolation for users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.users;

-- Comments, chat, notifications, documents, events, time entries policies
DROP POLICY IF EXISTS "Comments organization isolation" ON public.comments;
DROP POLICY IF EXISTS "Chat rooms organization isolation" ON public.chat_rooms;
DROP POLICY IF EXISTS "Chat messages organization isolation" ON public.chat_messages;
DROP POLICY IF EXISTS "Notifications organization isolation" ON public.notifications;
DROP POLICY IF EXISTS "Documents organization isolation" ON public.documents;
DROP POLICY IF EXISTS "Events organization isolation" ON public.events;
DROP POLICY IF EXISTS "Time entries organization isolation" ON public.time_entries;

-- Step 3: Re-enable RLS on all tables
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

-- Step 4: Create ONLY 3 essential, clean policies with unique names
-- These are the ONLY policies that should exist - no more infinite recursion!

-- 1. Projects: Clean organization isolation
CREATE POLICY "final_projects_org_access" ON public.projects
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- 2. Tasks: Clean organization isolation  
CREATE POLICY "final_tasks_org_access" ON public.tasks
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- 3. Users: Clean organization isolation
CREATE POLICY "final_users_org_access" ON public.users
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Step 5: Create essential policies for other tables to maintain functionality
CREATE POLICY "final_comments_org_access" ON public.comments
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "final_chat_rooms_org_access" ON public.chat_rooms
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "final_chat_messages_org_access" ON public.chat_messages
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "final_notifications_org_access" ON public.notifications
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "final_documents_org_access" ON public.documents
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "final_events_org_access" ON public.events
FOR ALL USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "final_time_entries_org_access" ON public.time_entries
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Project team members: Organization isolation via project lookup
CREATE POLICY "final_team_members_org_access" ON public.project_team_members
FOR ALL USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE organization_id = public.get_current_user_organization_id()
  )
);

-- Step 6: Verify the RLS function works correctly
-- This should now return your organization ID without infinite recursion
SELECT public.get_current_user_organization_id() as current_org_id;

-- Step 7: Test data access - these queries should now work
SELECT COUNT(*) as project_count FROM public.projects;
SELECT COUNT(*) as task_count FROM public.tasks;
SELECT COUNT(*) as user_count FROM public.users;
