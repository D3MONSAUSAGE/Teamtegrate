
-- Final comprehensive RLS cleanup to eliminate all infinite recursion
-- This migration will completely reset RLS policies and create clean ones

-- First, disable RLS temporarily to avoid any conflicts during cleanup
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL possible policy variations that might exist
-- Projects table policies
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

-- Tasks table policies
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

-- Project team members table policies
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

-- Re-enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- Create ONLY THREE clean policies with unique names
-- These are the ONLY policies that should exist on these tables

-- 1. Projects: Clean organization isolation
CREATE POLICY "org_isolation_projects_final" ON public.projects
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- 2. Tasks: Clean organization isolation  
CREATE POLICY "org_isolation_tasks_final" ON public.tasks
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- 3. Project team members: Clean organization isolation
-- Use a direct lookup to avoid any potential circular references
CREATE POLICY "org_isolation_team_members_final" ON public.project_team_members
FOR ALL USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE organization_id = public.get_current_user_organization_id()
  )
);
