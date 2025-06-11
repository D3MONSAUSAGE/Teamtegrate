
-- Phase 1: Multi-tenancy Schema Migration
-- Add organization_id to core tables and establish proper RLS policies

-- Step 1: Ensure Legacy Organization exists
INSERT INTO public.organizations (id, name, created_by, created_at)
SELECT 
  gen_random_uuid(),
  'Legacy Organization',
  (SELECT id FROM auth.users LIMIT 1),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE name = 'Legacy Organization');

-- Step 2: Add organization_id to tasks table
-- First add as nullable to populate existing records
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Populate existing tasks with Legacy Organization ID
UPDATE public.tasks 
SET organization_id = (SELECT id FROM public.organizations WHERE name = 'Legacy Organization' LIMIT 1)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL
ALTER TABLE public.tasks ALTER COLUMN organization_id SET NOT NULL;

-- Step 3: Add organization_id to projects table
-- First add as nullable to populate existing records
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Populate existing projects with Legacy Organization ID
UPDATE public.projects 
SET organization_id = (SELECT id FROM public.organizations WHERE name = 'Legacy Organization' LIMIT 1)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL
ALTER TABLE public.projects ALTER COLUMN organization_id SET NOT NULL;

-- Step 4: Fix invoices table organization_id to be NOT NULL
-- Update any NULL organization_id records with Legacy Organization
UPDATE public.invoices 
SET organization_id = (SELECT id FROM public.organizations WHERE name = 'Legacy Organization' LIMIT 1)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL for invoices
ALTER TABLE public.invoices ALTER COLUMN organization_id SET NOT NULL;

-- Step 5: Enable RLS on tasks and projects tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Org isolation for tasks" ON public.tasks;
DROP POLICY IF EXISTS "Org isolation for projects" ON public.projects;

-- Step 7: Create comprehensive RLS policies for tasks table
CREATE POLICY "Users can view tasks in their organization" 
ON public.tasks 
FOR SELECT 
USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert tasks in their organization" 
ON public.tasks 
FOR INSERT 
WITH CHECK (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update tasks in their organization" 
ON public.tasks 
FOR UPDATE 
USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete tasks in their organization" 
ON public.tasks 
FOR DELETE 
USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Step 8: Create comprehensive RLS policies for projects table
CREATE POLICY "Users can view projects in their organization" 
ON public.projects 
FOR SELECT 
USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert projects in their organization" 
ON public.projects 
FOR INSERT 
WITH CHECK (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update projects in their organization" 
ON public.projects 
FOR UPDATE 
USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete projects in their organization" 
ON public.projects 
FOR DELETE 
USING (organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Step 9: Update existing triggers to include organization_id
-- Update the project tasks count trigger to work with new schema
DROP TRIGGER IF EXISTS update_project_tasks_count_trigger ON public.tasks;
CREATE TRIGGER update_project_tasks_count_trigger
    AFTER INSERT OR DELETE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_project_tasks_count();

-- Update the budget spent trigger to work with new schema  
DROP TRIGGER IF EXISTS update_project_budget_spent_trigger ON public.tasks;
CREATE TRIGGER update_project_budget_spent_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_project_budget_spent_from_tasks();

-- Step 10: Verify the migration results
-- This will show the column exists and has proper constraints
SELECT 
    table_name,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'projects', 'invoices')
AND column_name = 'organization_id'
ORDER BY table_name;
