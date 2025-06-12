
-- First, let's get a complete list of all RLS policies on our target tables and drop them
-- This query will help us identify all policies that need to be dropped

-- Drop ALL existing RLS policies on projects table
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

-- Drop ALL existing RLS policies on tasks table
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

-- Drop ALL existing RLS policies on project_team_members table
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

-- Ensure RLS is enabled on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- Create ONLY THREE simple policies using the security definer function
-- This completely eliminates any possibility of infinite recursion

-- 1. Projects: Simple organization isolation
CREATE POLICY "projects_simple_org_isolation" ON public.projects
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- 2. Tasks: Simple organization isolation  
CREATE POLICY "tasks_simple_org_isolation" ON public.tasks
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- 3. Project team members: Simple organization isolation via project lookup
CREATE POLICY "project_team_members_simple_org_isolation" ON public.project_team_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_team_members.project_id 
    AND p.organization_id = public.get_current_user_organization_id()
  )
);
