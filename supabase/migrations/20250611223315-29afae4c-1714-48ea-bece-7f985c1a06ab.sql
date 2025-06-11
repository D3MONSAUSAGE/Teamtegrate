
-- Phase 2a: Schema & RLS Multi-tenancy Fixes
-- STEP 1: Add organization_id to missing tables and backfill data

-- Ensure Legacy Organization exists
INSERT INTO public.organizations (id, name, created_by, created_at)
SELECT 
  gen_random_uuid(),
  'Legacy Organization',
  (SELECT id FROM public.users LIMIT 1),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE name = 'Legacy Organization');

-- Get Legacy Org ID for backfilling
DO $$
DECLARE
  legacy_org_id UUID;
BEGIN
  SELECT id INTO legacy_org_id FROM public.organizations WHERE name = 'Legacy Organization';
  
  -- Add organization_id to events table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'organization_id') THEN
    ALTER TABLE public.events ADD COLUMN organization_id UUID;
  END IF;
  
  -- Backfill events with Legacy Org ID
  UPDATE public.events 
  SET organization_id = COALESCE(
    (SELECT organization_id FROM public.users WHERE users.id = events.user_id),
    legacy_org_id
  )
  WHERE organization_id IS NULL;
  
  -- Make events organization_id NOT NULL
  ALTER TABLE public.events ALTER COLUMN organization_id SET NOT NULL;
  
  -- Add foreign key constraint for events
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_events_organization') THEN
    ALTER TABLE public.events ADD CONSTRAINT fk_events_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Add organization_id to branches table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'organization_id') THEN
    ALTER TABLE public.branches ADD COLUMN organization_id UUID;
  END IF;
  
  -- Backfill branches with Legacy Org ID
  UPDATE public.branches 
  SET organization_id = COALESCE(
    (SELECT organization_id FROM public.users WHERE users.id = branches.user_id),
    legacy_org_id
  )
  WHERE organization_id IS NULL;
  
  -- Make branches organization_id NOT NULL
  ALTER TABLE public.branches ALTER COLUMN organization_id SET NOT NULL;
  
  -- Add foreign key constraint for branches
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_branches_organization') THEN
    ALTER TABLE public.branches ADD CONSTRAINT fk_branches_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Add organization_id to checklist_templates table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklist_templates' AND column_name = 'organization_id') THEN
    ALTER TABLE public.checklist_templates ADD COLUMN organization_id UUID;
  END IF;
  
  -- Backfill checklist_templates with Legacy Org ID
  UPDATE public.checklist_templates 
  SET organization_id = COALESCE(
    (SELECT organization_id FROM public.users WHERE users.id = checklist_templates.created_by),
    legacy_org_id
  )
  WHERE organization_id IS NULL;
  
  -- Make checklist_templates organization_id NOT NULL
  ALTER TABLE public.checklist_templates ALTER COLUMN organization_id SET NOT NULL;
  
  -- Add foreign key constraint for checklist_templates
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_checklist_templates_organization') THEN
    ALTER TABLE public.checklist_templates ADD CONSTRAINT fk_checklist_templates_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Add organization_id to checklists table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklists' AND column_name = 'organization_id') THEN
    ALTER TABLE public.checklists ADD COLUMN organization_id UUID;
  END IF;
  
  -- Backfill checklists with Legacy Org ID
  UPDATE public.checklists 
  SET organization_id = COALESCE(
    (SELECT organization_id FROM public.users WHERE users.id = checklists.created_by),
    legacy_org_id
  )
  WHERE organization_id IS NULL;
  
  -- Make checklists organization_id NOT NULL
  ALTER TABLE public.checklists ALTER COLUMN organization_id SET NOT NULL;
  
  -- Add foreign key constraint for checklists
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_checklists_organization') THEN
    ALTER TABLE public.checklists ADD CONSTRAINT fk_checklists_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- STEP 2: Nuclear RLS Policy Cleanup - Drop ALL existing policies

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view users in same organization" ON public.users;
DROP POLICY IF EXISTS "Admins can update users in same organization" ON public.users;
DROP POLICY IF EXISTS "Superadmins can insert users in same organization" ON public.users;
DROP POLICY IF EXISTS "Superadmins can delete users in same organization" ON public.users;

-- Drop all existing policies on projects table
DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Org isolation for projects" ON public.projects;

-- Drop all existing policies on tasks table
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Org isolation for tasks" ON public.tasks;

-- Drop existing policies on other tables
DROP POLICY IF EXISTS "Users can only access comments from their organization" ON public.comments;
DROP POLICY IF EXISTS "Users can only access messages from their organization" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can only access rooms from their organization" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can only access documents from their organization" ON public.documents;
DROP POLICY IF EXISTS "Users can only access notifications from their organization" ON public.notifications;
DROP POLICY IF EXISTS "Users can only access time entries from their organization" ON public.time_entries;

-- STEP 3: Create SECURITY DEFINER helper function to prevent recursion
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid();
$$;

-- STEP 4: Create clean, minimal RLS policies

-- Users table policies (using SECURITY DEFINER to avoid recursion)
CREATE POLICY "org_isolation_users_select" ON public.users
  FOR SELECT USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_users_insert" ON public.users
  FOR INSERT WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_users_update" ON public.users
  FOR UPDATE USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_users_delete" ON public.users
  FOR DELETE USING (
    organization_id = public.get_current_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Projects table policies
CREATE POLICY "org_isolation_projects_select" ON public.projects
  FOR SELECT USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_projects_insert" ON public.projects
  FOR INSERT WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_projects_update" ON public.projects
  FOR UPDATE USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_projects_delete" ON public.projects
  FOR DELETE USING (organization_id = public.get_current_user_organization_id());

-- Tasks table policies
CREATE POLICY "org_isolation_tasks_select" ON public.tasks
  FOR SELECT USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_tasks_update" ON public.tasks
  FOR UPDATE USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "org_isolation_tasks_delete" ON public.tasks
  FOR DELETE USING (organization_id = public.get_current_user_organization_id());

-- Comments table policies
CREATE POLICY "org_isolation_comments" ON public.comments
  FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Chat messages table policies
CREATE POLICY "org_isolation_chat_messages" ON public.chat_messages
  FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Chat rooms table policies
CREATE POLICY "org_isolation_chat_rooms" ON public.chat_rooms
  FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Documents table policies
CREATE POLICY "org_isolation_documents" ON public.documents
  FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Notifications table policies
CREATE POLICY "org_isolation_notifications" ON public.notifications
  FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Time entries table policies
CREATE POLICY "org_isolation_time_entries" ON public.time_entries
  FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Events table policies (newly added)
CREATE POLICY "org_isolation_events" ON public.events
  FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Branches table policies (newly added)
CREATE POLICY "org_isolation_branches" ON public.branches
  FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Checklist templates table policies (newly added)
CREATE POLICY "org_isolation_checklist_templates" ON public.checklist_templates
  FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Checklists table policies (newly added)
CREATE POLICY "org_isolation_checklists" ON public.checklists
  FOR ALL USING (organization_id = public.get_current_user_organization_id());

-- Enable RLS on all newly added tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance on new organization_id columns
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_branches_organization_id ON public.branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_organization_id ON public.checklist_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_checklists_organization_id ON public.checklists(organization_id);

-- STEP 5: Update triggers to auto-populate organization_id for new inserts
CREATE OR REPLACE FUNCTION public.set_organization_id_from_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Auto-populate organization_id from the current user if not provided
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := (SELECT organization_id FROM public.users WHERE id = auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the trigger to relevant tables
DROP TRIGGER IF EXISTS set_org_id_events ON public.events;
CREATE TRIGGER set_org_id_events
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_branches ON public.branches;
CREATE TRIGGER set_org_id_branches
  BEFORE INSERT ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_checklist_templates ON public.checklist_templates;
CREATE TRIGGER set_org_id_checklist_templates
  BEFORE INSERT ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_checklists ON public.checklists;
CREATE TRIGGER set_org_id_checklists
  BEFORE INSERT ON public.checklists
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id_from_user();
