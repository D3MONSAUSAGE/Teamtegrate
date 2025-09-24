-- First, let's create proper RLS policies for inventory_counts based on role and team membership

-- Drop existing policies for inventory_counts
DROP POLICY IF EXISTS "Users can view counts in their organization" ON public.inventory_counts;
DROP POLICY IF EXISTS "Admins can manage inventory counts" ON public.inventory_counts;
DROP POLICY IF EXISTS "Users can create counts in their organization" ON public.inventory_counts;
DROP POLICY IF EXISTS "Users can update their inventory counts" ON public.inventory_counts;

-- Create role-based access policies for inventory_counts
CREATE POLICY "Regular users see only their team counts"
ON public.inventory_counts
FOR SELECT
USING (
  organization_id = get_current_user_organization_id()
  AND (
    -- Admins and superadmins can see all counts
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    -- Managers can see counts for teams they manage
    (
      get_current_user_role() = 'manager'
      AND (
        team_id IS NULL -- All teams counts
        OR team_id IN (
          SELECT t.id FROM teams t 
          WHERE t.manager_id = auth.uid()
          AND t.organization_id = get_current_user_organization_id()
        )
      )
    )
    OR
    -- Regular users can only see counts for teams they belong to
    (
      team_id IS NULL -- All teams counts are visible to everyone
      OR team_id IN (
        SELECT tm.team_id FROM team_memberships tm
        WHERE tm.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM teams t 
          WHERE t.id = tm.team_id 
          AND t.organization_id = get_current_user_organization_id()
        )
      )
    )
  )
);

CREATE POLICY "Users can create counts for their teams"
ON public.inventory_counts
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND (
    -- Admins and superadmins can create counts for any team
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    -- Managers can create counts for teams they manage
    (
      get_current_user_role() = 'manager'
      AND (
        team_id IS NULL -- All teams
        OR team_id IN (
          SELECT t.id FROM teams t 
          WHERE t.manager_id = auth.uid()
          AND t.organization_id = get_current_user_organization_id()
        )
      )
    )
    OR
    -- Regular users can create counts for teams they belong to
    (
      team_id IS NULL -- All teams
      OR team_id IN (
        SELECT tm.team_id FROM team_memberships tm
        WHERE tm.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM teams t 
          WHERE t.id = tm.team_id 
          AND t.organization_id = get_current_user_organization_id()
        )
      )
    )
  )
);

CREATE POLICY "Users can update counts they can access"
ON public.inventory_counts
FOR UPDATE
USING (
  organization_id = get_current_user_organization_id()
  AND (
    -- Admins and superadmins can update all counts
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    -- Managers can update counts for teams they manage
    (
      get_current_user_role() = 'manager'
      AND (
        team_id IS NULL -- All teams counts
        OR team_id IN (
          SELECT t.id FROM teams t 
          WHERE t.manager_id = auth.uid()
          AND t.organization_id = get_current_user_organization_id()
        )
      )
    )
    OR
    -- Regular users can update counts for teams they belong to
    (
      team_id IS NULL -- All teams counts
      OR team_id IN (
        SELECT tm.team_id FROM team_memberships tm
        WHERE tm.user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM teams t 
          WHERE t.id = tm.team_id 
          AND t.organization_id = get_current_user_organization_id()
        )
      )
    )
  )
);

-- Create function to automatically assign templates to all teams when team_id is NULL
CREATE OR REPLACE FUNCTION public.assign_template_to_all_teams()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if this is a new template with team_id = NULL (All Teams)
  IF NEW.team_id IS NULL AND OLD IS NULL THEN
    -- Insert assignments for all active teams in the organization
    INSERT INTO public.team_inventory_assignments (
      template_id,
      team_id,
      assigned_by,
      organization_id,
      is_active
    )
    SELECT 
      NEW.id,
      t.id,
      NEW.created_by,
      NEW.organization_id,
      true
    FROM public.teams t
    WHERE t.organization_id = NEW.organization_id
      AND t.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic "All Teams" assignment
DROP TRIGGER IF EXISTS trigger_assign_template_to_all_teams ON public.inventory_templates;
CREATE TRIGGER trigger_assign_template_to_all_teams
  AFTER INSERT ON public.inventory_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_template_to_all_teams();