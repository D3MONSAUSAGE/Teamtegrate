-- Assign all global items to Cocina team
UPDATE inventory_items 
SET team_id = 'b18229e3-39b0-4b20-87fc-97b7f2757a3d'
WHERE team_id IS NULL;

-- Make team_id NOT NULL to enforce team isolation
ALTER TABLE inventory_items 
ALTER COLUMN team_id SET NOT NULL;

-- Update RLS policies for strict team isolation
DROP POLICY IF EXISTS "Users can view items in their organization" ON inventory_items;
DROP POLICY IF EXISTS "Admins can view all items in organization" ON inventory_items;
DROP POLICY IF EXISTS "Users can view their own team items" ON inventory_items;

-- Users see only their team's items (or all teams if admin)
CREATE POLICY "Users can view their team items or admins see all"
ON inventory_items
FOR SELECT
USING (
  organization_id = get_current_user_organization_id() AND (
    -- Admins see all items in their org
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'superadmin')
    )
    OR
    -- Regular users see only their team's items
    team_id IN (
      SELECT team_id FROM team_memberships 
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can only create items for their own teams (admins can create for any team)
DROP POLICY IF EXISTS "Users can create items in their organization" ON inventory_items;

CREATE POLICY "Users can create items for their teams"
ON inventory_items
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  team_id IS NOT NULL AND (
    -- Admins can create for any team
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'superadmin')
    )
    OR
    -- Regular users can only create for their own teams
    team_id IN (
      SELECT team_id FROM team_memberships 
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can only update items in their teams (admins can update any)
DROP POLICY IF EXISTS "Users can update items in their organization" ON inventory_items;

CREATE POLICY "Users can update their team items"
ON inventory_items
FOR UPDATE
USING (
  organization_id = get_current_user_organization_id() AND (
    -- Admins can update any item
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'superadmin')
    )
    OR
    -- Regular users can only update their team's items
    team_id IN (
      SELECT team_id FROM team_memberships 
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can only delete items in their teams (admins can delete any)
DROP POLICY IF EXISTS "Admins can delete items" ON inventory_items;

CREATE POLICY "Users can delete their team items"
ON inventory_items
FOR DELETE
USING (
  organization_id = get_current_user_organization_id() AND (
    -- Admins can delete any item
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'superadmin')
    )
    OR
    -- Regular users can only delete their team's items
    team_id IN (
      SELECT team_id FROM team_memberships 
      WHERE user_id = auth.uid()
    )
  )
);