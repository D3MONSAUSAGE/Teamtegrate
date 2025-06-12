
-- First, let's drop any existing problematic RLS policies on projects table
DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.projects;

-- Drop any existing problematic RLS policies on tasks table
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.tasks;

-- Enable RLS on both tables (if not already enabled)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies for projects using the existing security definer function
CREATE POLICY "Projects organization isolation" ON public.projects
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Create new RLS policies for tasks using the existing security definer function  
CREATE POLICY "Tasks organization isolation" ON public.tasks
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Also fix any other tables that might have similar issues
DROP POLICY IF EXISTS "Users can view comments in their organization" ON public.comments;
CREATE POLICY "Comments organization isolation" ON public.comments
FOR ALL USING (organization_id = public.get_current_user_organization_id());

DROP POLICY IF EXISTS "Users can view chat_rooms in their organization" ON public.chat_rooms;
CREATE POLICY "Chat rooms organization isolation" ON public.chat_rooms
FOR ALL USING (organization_id = public.get_current_user_organization_id());

DROP POLICY IF EXISTS "Users can view chat_messages in their organization" ON public.chat_messages;
CREATE POLICY "Chat messages organization isolation" ON public.chat_messages
FOR ALL USING (organization_id = public.get_current_user_organization_id());

DROP POLICY IF EXISTS "Users can view notifications in their organization" ON public.notifications;
CREATE POLICY "Notifications organization isolation" ON public.notifications
FOR ALL USING (organization_id = public.get_current_user_organization_id());

DROP POLICY IF EXISTS "Users can view documents in their organization" ON public.documents;
CREATE POLICY "Documents organization isolation" ON public.documents
FOR ALL USING (organization_id = public.get_current_user_organization_id());

DROP POLICY IF EXISTS "Users can view events in their organization" ON public.events;
CREATE POLICY "Events organization isolation" ON public.events
FOR ALL USING (organization_id = public.get_current_user_organization_id());

DROP POLICY IF EXISTS "Users can view time_entries in their organization" ON public.time_entries;
CREATE POLICY "Time entries organization isolation" ON public.time_entries
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Users table should allow users to see other users in their organization
DROP POLICY IF EXISTS "Users can view users in their organization" ON public.users;
CREATE POLICY "Users organization isolation" ON public.users
FOR ALL USING (organization_id = public.get_current_user_organization_id());
