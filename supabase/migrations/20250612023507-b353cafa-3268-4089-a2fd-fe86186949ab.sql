
-- Drop ALL existing RLS policies on projects table to eliminate conflicts
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

-- Drop ALL existing RLS policies on tasks table to eliminate conflicts
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

-- Drop ALL existing RLS policies on project_team_members table to eliminate conflicts
DROP POLICY IF EXISTS "Users can view team members in their organization" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can add team members in their organization" ON public.project_team_members;
DROP POLICY IF EXISTS "Users can remove team members in their organization" ON public.project_team_members;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.project_team_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.project_team_members;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.project_team_members;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.project_team_members;
DROP POLICY IF EXISTS "Project managers can manage team members" ON public.project_team_members;
DROP POLICY IF EXISTS "Team members can view project membership" ON public.project_team_members;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- Create ONE simple policy per table using only the security definer function
-- This eliminates any possibility of infinite recursion

-- Projects: Simple organization isolation
CREATE POLICY "projects_org_isolation" ON public.projects
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Tasks: Simple organization isolation  
CREATE POLICY "tasks_org_isolation" ON public.tasks
FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Project team members: Simple organization isolation via project
CREATE POLICY "project_team_members_org_isolation" ON public.project_team_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_team_members.project_id 
    AND p.organization_id = public.get_current_user_organization_id()
  )
);
