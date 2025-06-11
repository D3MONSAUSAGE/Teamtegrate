
-- Fix migration by handling null user_id cases properly

-- First, let's see what tasks have null user_id and handle them
-- We'll assign them to a default 'Legacy Org' if needed

-- Ensure Legacy Org exists
INSERT INTO public.organizations (id, name, created_by, created_at)
SELECT 
  gen_random_uuid(), 
  'Legacy Org', 
  (SELECT id FROM auth.users LIMIT 1), 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE name = 'Legacy Org');

-- Get the Legacy Org ID
DO $$
DECLARE
  legacy_org_id UUID;
BEGIN
  SELECT id INTO legacy_org_id FROM public.organizations WHERE name = 'Legacy Org';
  
  -- Add organization_id to tasks table (if not already added)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'organization_id') THEN
    ALTER TABLE public.tasks ADD COLUMN organization_id UUID;
  END IF;

  -- Backfill tasks organization_id from user_id where possible
  UPDATE public.tasks 
  SET organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE users.id = tasks.user_id::uuid
  )
  WHERE organization_id IS NULL 
    AND user_id IS NOT NULL 
    AND user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  -- For tasks with null or invalid user_id, assign to Legacy Org
  UPDATE public.tasks 
  SET organization_id = legacy_org_id
  WHERE organization_id IS NULL;

  -- Make tasks organization_id NOT NULL
  ALTER TABLE public.tasks ALTER COLUMN organization_id SET NOT NULL;

  -- Add foreign key constraint for tasks (if not exists)
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_tasks_organization') THEN
    ALTER TABLE public.tasks ADD CONSTRAINT fk_tasks_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Projects
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'organization_id') THEN
    ALTER TABLE public.projects ADD COLUMN organization_id UUID;
  END IF;

  UPDATE public.projects 
  SET organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE users.id = projects.manager_id::uuid
  )
  WHERE organization_id IS NULL 
    AND manager_id IS NOT NULL 
    AND manager_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  UPDATE public.projects 
  SET organization_id = legacy_org_id
  WHERE organization_id IS NULL;

  ALTER TABLE public.projects ALTER COLUMN organization_id SET NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_projects_organization') THEN
    ALTER TABLE public.projects ADD CONSTRAINT fk_projects_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Project tasks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'organization_id') THEN
    ALTER TABLE public.project_tasks ADD COLUMN organization_id UUID;
  END IF;

  UPDATE public.project_tasks 
  SET organization_id = (
    SELECT organization_id 
    FROM public.projects 
    WHERE projects.id = project_tasks.project_id
  )
  WHERE organization_id IS NULL AND project_id IS NOT NULL;

  UPDATE public.project_tasks 
  SET organization_id = legacy_org_id
  WHERE organization_id IS NULL;

  ALTER TABLE public.project_tasks ALTER COLUMN organization_id SET NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_project_tasks_organization') THEN
    ALTER TABLE public.project_tasks ADD CONSTRAINT fk_project_tasks_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Events
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'organization_id') THEN
    ALTER TABLE public.events ADD COLUMN organization_id UUID;
  END IF;

  UPDATE public.events 
  SET organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE users.id = events.user_id
  )
  WHERE organization_id IS NULL AND user_id IS NOT NULL;

  UPDATE public.events 
  SET organization_id = legacy_org_id
  WHERE organization_id IS NULL;

  ALTER TABLE public.events ALTER COLUMN organization_id SET NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_events_organization') THEN
    ALTER TABLE public.events ADD CONSTRAINT fk_events_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Continue with other tables...
  -- Journal entries
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'organization_id') THEN
    ALTER TABLE public.journal_entries ADD COLUMN organization_id UUID;
  END IF;

  UPDATE public.journal_entries 
  SET organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE users.id = journal_entries.user_id
  )
  WHERE organization_id IS NULL AND user_id IS NOT NULL;

  UPDATE public.journal_entries 
  SET organization_id = legacy_org_id
  WHERE organization_id IS NULL;

  ALTER TABLE public.journal_entries ALTER COLUMN organization_id SET NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_journal_entries_organization') THEN
    ALTER TABLE public.journal_entries ADD CONSTRAINT fk_journal_entries_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Branches
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'organization_id') THEN
    ALTER TABLE public.branches ADD COLUMN organization_id UUID;
  END IF;

  UPDATE public.branches 
  SET organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE users.id = branches.user_id
  )
  WHERE organization_id IS NULL AND user_id IS NOT NULL;

  UPDATE public.branches 
  SET organization_id = legacy_org_id
  WHERE organization_id IS NULL;

  ALTER TABLE public.branches ALTER COLUMN organization_id SET NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_branches_organization') THEN
    ALTER TABLE public.branches ADD CONSTRAINT fk_branches_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Team members
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'organization_id') THEN
    ALTER TABLE public.team_members ADD COLUMN organization_id UUID;
  END IF;

  UPDATE public.team_members 
  SET organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE users.id = team_members.manager_id
  )
  WHERE organization_id IS NULL AND manager_id IS NOT NULL;

  UPDATE public.team_members 
  SET organization_id = legacy_org_id
  WHERE organization_id IS NULL;

  ALTER TABLE public.team_members ALTER COLUMN organization_id SET NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_team_members_organization') THEN
    ALTER TABLE public.team_members ADD CONSTRAINT fk_team_members_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Checklists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklists' AND column_name = 'organization_id') THEN
    ALTER TABLE public.checklists ADD COLUMN organization_id UUID;
  END IF;

  UPDATE public.checklists 
  SET organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE users.id = checklists.created_by
  )
  WHERE organization_id IS NULL AND created_by IS NOT NULL;

  UPDATE public.checklists 
  SET organization_id = legacy_org_id
  WHERE organization_id IS NULL;

  ALTER TABLE public.checklists ALTER COLUMN organization_id SET NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_checklists_organization') THEN
    ALTER TABLE public.checklists ADD CONSTRAINT fk_checklists_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Checklist templates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklist_templates' AND column_name = 'organization_id') THEN
    ALTER TABLE public.checklist_templates ADD COLUMN organization_id UUID;
  END IF;

  UPDATE public.checklist_templates 
  SET organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE users.id = checklist_templates.created_by
  )
  WHERE organization_id IS NULL AND created_by IS NOT NULL;

  UPDATE public.checklist_templates 
  SET organization_id = legacy_org_id
  WHERE organization_id IS NULL;

  ALTER TABLE public.checklist_templates ALTER COLUMN organization_id SET NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_checklist_templates_organization') THEN
    ALTER TABLE public.checklist_templates ADD CONSTRAINT fk_checklist_templates_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Shared folders
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shared_folders' AND column_name = 'organization_id') THEN
    ALTER TABLE public.shared_folders ADD COLUMN organization_id UUID;
  END IF;

  UPDATE public.shared_folders 
  SET organization_id = (
    SELECT organization_id 
    FROM public.users 
    WHERE users.id = shared_folders.owner_id
  )
  WHERE organization_id IS NULL AND owner_id IS NOT NULL;

  UPDATE public.shared_folders 
  SET organization_id = legacy_org_id
  WHERE organization_id IS NULL;

  ALTER TABLE public.shared_folders ALTER COLUMN organization_id SET NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_shared_folders_organization') THEN
    ALTER TABLE public.shared_folders ADD CONSTRAINT fk_shared_folders_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- Chat room participants
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_room_participants' AND column_name = 'organization_id') THEN
    ALTER TABLE public.chat_room_participants ADD COLUMN organization_id UUID;
  END IF;

  UPDATE public.chat_room_participants 
  SET organization_id = (
    SELECT organization_id 
    FROM public.chat_rooms 
    WHERE chat_rooms.id = chat_room_participants.room_id
  )
  WHERE organization_id IS NULL AND room_id IS NOT NULL;

  UPDATE public.chat_room_participants 
  SET organization_id = legacy_org_id
  WHERE organization_id IS NULL;

  ALTER TABLE public.chat_room_participants ALTER COLUMN organization_id SET NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_chat_room_participants_organization') THEN
    ALTER TABLE public.chat_room_participants ADD CONSTRAINT fk_chat_room_participants_organization 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

END $$;

-- Enable RLS on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
  -- Tasks policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view tasks in their organization') THEN
    CREATE POLICY "Users can view tasks in their organization" 
    ON public.tasks FOR ALL 
    USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
  END IF;

  -- Projects policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view projects in their organization') THEN
    CREATE POLICY "Users can view projects in their organization" 
    ON public.projects FOR ALL 
    USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
  END IF;

  -- Project tasks policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_tasks' AND policyname = 'Users can view project tasks in their organization') THEN
    CREATE POLICY "Users can view project tasks in their organization" 
    ON public.project_tasks FOR ALL 
    USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
  END IF;

  -- Events policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Users can view events in their organization') THEN
    CREATE POLICY "Users can view events in their organization" 
    ON public.events FOR ALL 
    USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
  END IF;

  -- Journal entries policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_entries' AND policyname = 'Users can view journal entries in their organization') THEN
    CREATE POLICY "Users can view journal entries in their organization" 
    ON public.journal_entries FOR ALL 
    USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
  END IF;

  -- Branches policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'Users can view branches in their organization') THEN
    CREATE POLICY "Users can view branches in their organization" 
    ON public.branches FOR ALL 
    USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
  END IF;

  -- Team members policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Users can view team members in their organization') THEN
    CREATE POLICY "Users can view team members in their organization" 
    ON public.team_members FOR ALL 
    USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
  END IF;

  -- Checklists policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'checklists' AND policyname = 'Users can view checklists in their organization') THEN
    CREATE POLICY "Users can view checklists in their organization" 
    ON public.checklists FOR ALL 
    USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
  END IF;

  -- Checklist templates policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'checklist_templates' AND policyname = 'Users can view checklist templates in their organization') THEN
    CREATE POLICY "Users can view checklist templates in their organization" 
    ON public.checklist_templates FOR ALL 
    USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
  END IF;

  -- Shared folders policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shared_folders' AND policyname = 'Users can view shared folders in their organization') THEN
    CREATE POLICY "Users can view shared folders in their organization" 
    ON public.shared_folders FOR ALL 
    USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
  END IF;

  -- Chat room participants policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_room_participants' AND policyname = 'Users can view chat room participants in their organization') THEN
    CREATE POLICY "Users can view chat room participants in their organization" 
    ON public.chat_room_participants FOR ALL 
    USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_organization_id ON public.project_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_organization_id ON public.journal_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_branches_organization_id ON public.branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_organization_id ON public.team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_checklists_organization_id ON public.checklists(organization_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_organization_id ON public.checklist_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_shared_folders_organization_id ON public.shared_folders(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_participants_organization_id ON public.chat_room_participants(organization_id);
