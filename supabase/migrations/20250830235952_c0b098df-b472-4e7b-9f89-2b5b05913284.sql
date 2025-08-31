-- Phase 1: Add team_id columns to existing tables for team integration
-- All additions are nullable for backward compatibility

-- Add team_id to sales_data table
ALTER TABLE public.sales_data 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to invoices table  
ALTER TABLE public.invoices 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to petty_cash_transactions table
ALTER TABLE public.petty_cash_transactions 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to transactions table
ALTER TABLE public.transactions 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to time_entries table
ALTER TABLE public.time_entries 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to tasks table (in addition to existing assignment fields)
ALTER TABLE public.tasks 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to documents table
ALTER TABLE public.documents 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to chat_rooms table
ALTER TABLE public.chat_rooms 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add team_id to events table
ALTER TABLE public.events 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Create project_teams junction table for many-to-many relationship
CREATE TABLE public.project_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.users(id),
  UNIQUE(project_id, team_id)
);

-- Enable RLS on project_teams
ALTER TABLE public.project_teams ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_sales_data_team_id ON public.sales_data(team_id);
CREATE INDEX idx_invoices_team_id ON public.invoices(team_id);
CREATE INDEX idx_petty_cash_transactions_team_id ON public.petty_cash_transactions(team_id);
CREATE INDEX idx_transactions_team_id ON public.transactions(team_id);
CREATE INDEX idx_time_entries_team_id ON public.time_entries(team_id);
CREATE INDEX idx_tasks_team_id ON public.tasks(team_id);
CREATE INDEX idx_documents_team_id ON public.documents(team_id);
CREATE INDEX idx_chat_rooms_team_id ON public.chat_rooms(team_id);
CREATE INDEX idx_events_team_id ON public.events(team_id);
CREATE INDEX idx_project_teams_project_id ON public.project_teams(project_id);
CREATE INDEX idx_project_teams_team_id ON public.project_teams(team_id);

-- Create team_details view for enhanced team information
CREATE OR REPLACE VIEW public.team_details AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.manager_id,
  t.organization_id,
  t.created_at,
  t.updated_at,
  t.is_active,
  u.name as manager_name,
  u.email as manager_email,
  COALESCE(tm_count.member_count, 0) as member_count
FROM public.teams t
LEFT JOIN public.users u ON t.manager_id = u.id
LEFT JOIN (
  SELECT team_id, COUNT(*) as member_count
  FROM public.team_memberships
  GROUP BY team_id
) tm_count ON t.id = tm_count.team_id;

-- RLS Policies for project_teams
CREATE POLICY "Users can view project teams in their organization" 
ON public.project_teams FOR SELECT 
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE organization_id = get_current_user_organization_id()
  )
);

CREATE POLICY "Managers can manage project teams in their organization" 
ON public.project_teams FOR ALL 
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE organization_id = get_current_user_organization_id()
  ) AND (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = ANY(ARRAY['manager', 'admin', 'superadmin'])
    )
  )
);

-- Function to get user's team memberships
CREATE OR REPLACE FUNCTION public.get_user_teams(user_id_param UUID)
RETURNS TABLE(team_id UUID, team_name TEXT, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.team_id,
    t.name as team_name,
    tm.role
  FROM public.team_memberships tm
  JOIN public.teams t ON tm.team_id = t.id
  WHERE tm.user_id = user_id_param
    AND t.is_active = true;
END;
$$;

-- Function to check if user can access team data
CREATE OR REPLACE FUNCTION public.can_user_access_team_data(team_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_org_id UUID;
  team_org_id UUID;
BEGIN
  -- Get user info
  SELECT role, organization_id INTO user_role, user_org_id
  FROM public.users WHERE id = user_id_param;
  
  -- Get team org
  SELECT organization_id INTO team_org_id
  FROM public.teams WHERE id = team_id_param;
  
  -- Must be same organization
  IF user_org_id != team_org_id THEN
    RETURN FALSE;
  END IF;
  
  -- Superadmins and admins can access all teams in their org
  IF user_role IN ('superadmin', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Managers can access teams they manage
  IF user_role = 'manager' AND EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_id_param AND manager_id = user_id_param
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Users can access teams they're members of
  IF EXISTS (
    SELECT 1 FROM public.team_memberships 
    WHERE team_id = team_id_param AND user_id = user_id_param
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;