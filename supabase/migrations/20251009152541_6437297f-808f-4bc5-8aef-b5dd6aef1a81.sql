
-- Fix inventory management RLS policies to include team-level managers
-- This allows users with team_memberships.role = 'manager' to manage their team's inventory

-- Drop existing policies that need updating
DROP POLICY IF EXISTS "Managers can create inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers can update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers can create templates" ON inventory_templates;
DROP POLICY IF EXISTS "Managers can update their templates" ON inventory_templates;
DROP POLICY IF EXISTS "Managers can delete their own templates" ON inventory_templates;
DROP POLICY IF EXISTS "Users can create transactions for their teams" ON inventory_transactions;
DROP POLICY IF EXISTS "Users can view transactions based on role and team" ON inventory_transactions;

-- INVENTORY ITEMS POLICIES
-- Allow team-level managers to create items for their teams
CREATE POLICY "Managers can create inventory items" ON inventory_items
  FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() 
    AND created_by = auth.uid()
    AND (
      -- Organization-wide manager/admin/superadmin
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = ANY(ARRAY['manager', 'admin', 'superadmin'])
      )
      OR
      -- Team-level manager (via team_memberships)
      (team_id IS NOT NULL AND team_id IN (
        SELECT tm.team_id FROM team_memberships tm
        WHERE tm.user_id = auth.uid() AND tm.role = 'manager'
      ))
    )
  );

-- Allow team-level managers to update items for their teams
CREATE POLICY "Managers can update inventory items" ON inventory_items
  FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id()
    AND (
      -- Organization-wide manager/admin/superadmin
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = ANY(ARRAY['manager', 'admin', 'superadmin'])
      )
      OR
      -- Team-level manager (via team_memberships)
      (team_id IS NOT NULL AND team_id IN (
        SELECT tm.team_id FROM team_memberships tm
        WHERE tm.user_id = auth.uid() AND tm.role = 'manager'
      ))
    )
  );

-- INVENTORY TEMPLATES POLICIES
-- Allow team-level managers to create templates
CREATE POLICY "Managers can create templates" ON inventory_templates
  FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() 
    AND created_by = auth.uid()
    AND (
      -- Organization-wide manager/admin/superadmin
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = ANY(ARRAY['manager', 'admin', 'superadmin'])
      )
      OR
      -- Team-level manager (via team_memberships)
      (team_id IS NOT NULL AND team_id IN (
        SELECT tm.team_id FROM team_memberships tm
        WHERE tm.user_id = auth.uid() AND tm.role = 'manager'
      ))
    )
  );

-- Allow team-level managers to update their templates
CREATE POLICY "Managers can update their templates" ON inventory_templates
  FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id()
    AND (
      created_by = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = ANY(ARRAY['admin', 'superadmin'])
      )
      OR
      -- Team-level manager can update templates for their team
      (team_id IS NOT NULL AND team_id IN (
        SELECT tm.team_id FROM team_memberships tm
        WHERE tm.user_id = auth.uid() AND tm.role = 'manager'
      ))
    )
  );

-- Allow team-level managers to delete their own templates
CREATE POLICY "Managers can delete their own templates" ON inventory_templates
  FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id() 
    AND created_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = ANY(ARRAY['manager', 'admin', 'superadmin'])
      )
      OR
      -- Team-level manager can delete templates for their team
      (team_id IS NOT NULL AND team_id IN (
        SELECT tm.team_id FROM team_memberships tm
        WHERE tm.user_id = auth.uid() AND tm.role = 'manager'
      ))
    )
  );

-- INVENTORY TRANSACTIONS POLICIES
-- Allow team-level managers to create transactions for their teams
CREATE POLICY "Users can create transactions for their teams" ON inventory_transactions
  FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id()
    AND (
      -- Organization-wide admin/superadmin
      (SELECT users.role FROM users WHERE users.id = auth.uid()) = ANY(ARRAY['admin', 'superadmin'])
      OR
      -- Primary team manager (teams.manager_id)
      team_id IN (SELECT teams.id FROM teams WHERE teams.manager_id = auth.uid())
      OR
      -- Team-level manager (via team_memberships)
      team_id IN (
        SELECT tm.team_id FROM team_memberships tm
        WHERE tm.user_id = auth.uid() AND tm.role = 'manager'
      )
      OR
      -- Global items (no team_id)
      team_id IS NULL
    )
  );

-- Allow team-level managers to view transactions for their teams
CREATE POLICY "Users can view transactions based on role and team" ON inventory_transactions
  FOR SELECT
  USING (
    organization_id = get_current_user_organization_id()
    AND (
      -- Organization-wide admin/superadmin
      (SELECT users.role FROM users WHERE users.id = auth.uid()) = ANY(ARRAY['admin', 'superadmin'])
      OR
      -- Primary team manager (teams.manager_id)
      team_id IN (SELECT teams.id FROM teams WHERE teams.manager_id = auth.uid())
      OR
      -- Team-level manager (via team_memberships)
      team_id IN (
        SELECT tm.team_id FROM team_memberships tm
        WHERE tm.user_id = auth.uid() AND tm.role = 'manager'
      )
      OR
      -- Global items (no team_id)
      team_id IS NULL
    )
  );
