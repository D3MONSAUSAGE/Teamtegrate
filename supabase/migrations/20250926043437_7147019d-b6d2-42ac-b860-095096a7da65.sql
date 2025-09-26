-- Add team_id to warehouses table for team-based warehouse management
ALTER TABLE public.warehouses ADD COLUMN team_id uuid REFERENCES public.teams(id);

-- Update RLS policies for team-based access
DROP POLICY IF EXISTS "Users can view warehouses in their organization" ON public.warehouses;
DROP POLICY IF EXISTS "Managers can create warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Managers can update warehouses" ON public.warehouses;

-- New RLS policies for team-based warehouse access
CREATE POLICY "Admins can view all warehouses in organization" 
ON public.warehouses 
FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Managers can view warehouses for their teams" 
ON public.warehouses 
FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND
  (
    -- Admins/superadmins can see all
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    ) OR
    -- Managers can see warehouses for teams they manage
    (
      team_id IN (
        SELECT id FROM teams 
        WHERE manager_id = auth.uid() 
        AND organization_id = get_current_user_organization_id()
      )
    ) OR
    -- Team members can see their team's warehouse
    (
      team_id IN (
        SELECT team_id FROM team_memberships 
        WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Managers can create warehouses for their teams" 
ON public.warehouses 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  (
    -- Admins/superadmins can create warehouses for any team
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    ) OR
    -- Managers can create warehouses for teams they manage
    (
      team_id IN (
        SELECT id FROM teams 
        WHERE manager_id = auth.uid() 
        AND organization_id = get_current_user_organization_id()
      )
    )
  )
);

CREATE POLICY "Managers can update warehouses for their teams" 
ON public.warehouses 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  (
    -- Admins/superadmins can update all warehouses
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    ) OR
    -- Managers can update warehouses for teams they manage
    (
      team_id IN (
        SELECT id FROM teams 
        WHERE manager_id = auth.uid() 
        AND organization_id = get_current_user_organization_id()
      )
    )
  )
);

-- Assign existing primary warehouse to "cocina" team if it exists
UPDATE public.warehouses 
SET team_id = (
  SELECT id FROM public.teams 
  WHERE LOWER(name) = 'cocina' 
  AND organization_id = warehouses.organization_id
  LIMIT 1
)
WHERE team_id IS NULL 
AND EXISTS (
  SELECT 1 FROM public.teams 
  WHERE LOWER(name) = 'cocina' 
  AND organization_id = warehouses.organization_id
);