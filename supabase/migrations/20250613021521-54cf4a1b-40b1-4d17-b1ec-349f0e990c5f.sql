
-- Clean up conflicting RLS policies on tasks table
DROP POLICY IF EXISTS "tasks_org_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_org_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_org_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_org_delete" ON public.tasks;

-- Add proper RLS policies for team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Add organization_id to team_members if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_members' 
                   AND column_name = 'organization_id') THEN
        ALTER TABLE public.team_members 
        ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Update existing team_members to have the organization_id from their manager
UPDATE public.team_members 
SET organization_id = (
    SELECT u.organization_id 
    FROM public.users u 
    WHERE u.id = team_members.manager_id
)
WHERE organization_id IS NULL;

-- Delete any team_members that still have NULL organization_id (orphaned records)
DELETE FROM public.team_members WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after cleaning up
ALTER TABLE public.team_members 
ALTER COLUMN organization_id SET NOT NULL;

-- Create team_members policies using organization_id directly
CREATE POLICY "team_members_org_select" 
ON public.team_members 
FOR SELECT 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

CREATE POLICY "team_members_org_insert" 
ON public.team_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
  AND public.get_current_user_role() IN ('manager', 'admin', 'superadmin')
);

CREATE POLICY "team_members_org_update" 
ON public.team_members 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    manager_id = auth.uid()
    OR public.get_current_user_role() IN ('admin', 'superadmin')
  )
);

CREATE POLICY "team_members_org_delete" 
ON public.team_members 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (
    manager_id = auth.uid()
    OR public.get_current_user_role() IN ('admin', 'superadmin')
  )
);
