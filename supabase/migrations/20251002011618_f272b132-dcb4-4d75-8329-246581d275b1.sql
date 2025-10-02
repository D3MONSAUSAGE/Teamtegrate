-- Update RLS policies for finance tables to enforce team-based access for managers
-- Fixed version with unique policy names

-- ============================================================================
-- SALES DATA TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view sales data in their organization" ON sales_data;
DROP POLICY IF EXISTS "Managers can manage sales data" ON sales_data;
DROP POLICY IF EXISTS "Managers can view sales data for their teams" ON sales_data;
DROP POLICY IF EXISTS "Managers can insert sales data for their teams" ON sales_data;
DROP POLICY IF EXISTS "Managers can update sales data for their teams" ON sales_data;
DROP POLICY IF EXISTS "Managers can delete sales data for their teams" ON sales_data;

-- Managers can only view sales data for their managed teams
CREATE POLICY "Managers can view sales data for their teams"
ON sales_data
FOR SELECT
USING (
  organization_id = get_current_user_organization_id()
  AND (
    -- Admins and superadmins can see all teams
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    -- Managers can only see their managed teams
    (
      get_current_user_role() = 'manager'
      AND team_id IN (
        SELECT id FROM teams 
        WHERE manager_id = auth.uid()
        AND is_active = true
      )
    )
    OR
    -- Regular users can see their team's data
    (
      get_current_user_role() NOT IN ('admin', 'superadmin', 'manager')
      AND team_id IN (
        SELECT team_id FROM team_memberships
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- Managers can only insert sales data for their managed teams
CREATE POLICY "Managers can insert sales data for their teams"
ON sales_data
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND (
    -- Admins and superadmins can insert for all teams
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    -- Managers can only insert for their managed teams
    (
      get_current_user_role() = 'manager'
      AND team_id IN (
        SELECT id FROM teams 
        WHERE manager_id = auth.uid()
        AND is_active = true
      )
    )
  )
);

-- Managers can only update sales data for their managed teams
CREATE POLICY "Managers can update sales data for their teams"
ON sales_data
FOR UPDATE
USING (
  organization_id = get_current_user_organization_id()
  AND (
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    (
      get_current_user_role() = 'manager'
      AND team_id IN (
        SELECT id FROM teams 
        WHERE manager_id = auth.uid()
        AND is_active = true
      )
    )
  )
);

-- Managers can only delete sales data for their managed teams
CREATE POLICY "Managers can delete sales data for their teams"
ON sales_data
FOR DELETE
USING (
  organization_id = get_current_user_organization_id()
  AND (
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    (
      get_current_user_role() = 'manager'
      AND team_id IN (
        SELECT id FROM teams 
        WHERE manager_id = auth.uid()
        AND is_active = true
      )
    )
  )
);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view invoices in their organization" ON invoices;
DROP POLICY IF EXISTS "Users can create invoices in their organization" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices in their organization" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices in their organization" ON invoices;
DROP POLICY IF EXISTS "Users can view invoices for their teams" ON invoices;
DROP POLICY IF EXISTS "Users can create invoices for their teams" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices for their teams" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices for their teams" ON invoices;

-- View invoices based on team access
CREATE POLICY "Users can view invoices for their teams"
ON invoices
FOR SELECT
USING (
  organization_id = get_current_user_organization_id()
  AND (
    -- Admins and superadmins can see all
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    -- Managers can only see invoices for their managed teams
    (
      get_current_user_role() = 'manager'
      AND (
        team_id IN (
          SELECT id FROM teams 
          WHERE manager_id = auth.uid()
          AND is_active = true
        )
        OR team_id IS NULL -- Allow viewing unassigned invoices
      )
    )
    OR
    -- Regular users see their team's invoices
    (
      get_current_user_role() NOT IN ('admin', 'superadmin', 'manager')
      AND (
        team_id IN (
          SELECT team_id FROM team_memberships
          WHERE user_id = auth.uid()
        )
        OR team_id IS NULL
      )
    )
  )
);

-- Insert invoices for managed teams only
CREATE POLICY "Users can create invoices for their teams"
ON invoices
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND (
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    (
      get_current_user_role() = 'manager'
      AND (
        team_id IN (
          SELECT id FROM teams 
          WHERE manager_id = auth.uid()
          AND is_active = true
        )
        OR team_id IS NULL
      )
    )
  )
);

-- Update invoices for managed teams only
CREATE POLICY "Users can update invoices for their teams"
ON invoices
FOR UPDATE
USING (
  organization_id = get_current_user_organization_id()
  AND (
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    (
      get_current_user_role() = 'manager'
      AND (
        team_id IN (
          SELECT id FROM teams 
          WHERE manager_id = auth.uid()
          AND is_active = true
        )
        OR team_id IS NULL
      )
    )
  )
);

-- Delete invoices for managed teams only
CREATE POLICY "Users can delete invoices for their teams"
ON invoices
FOR DELETE
USING (
  organization_id = get_current_user_organization_id()
  AND (
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    (
      get_current_user_role() = 'manager'
      AND (
        team_id IN (
          SELECT id FROM teams 
          WHERE manager_id = auth.uid()
          AND is_active = true
        )
        OR team_id IS NULL
      )
    )
  )
);

-- ============================================================================
-- CREATED_INVOICES TABLE (for invoice creation feature)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view created invoices" ON created_invoices;
DROP POLICY IF EXISTS "Users can create invoices" ON created_invoices;
DROP POLICY IF EXISTS "Users can update created invoices" ON created_invoices;
DROP POLICY IF EXISTS "Users can view created invoices for their teams" ON created_invoices;
DROP POLICY IF EXISTS "Users can create invoices for their teams" ON created_invoices;
DROP POLICY IF EXISTS "Users can update created invoices for their teams" ON created_invoices;

-- View created invoices based on team access
CREATE POLICY "Team-based view for created invoices"
ON created_invoices
FOR SELECT
USING (
  organization_id = get_current_user_organization_id()
  AND (
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    (
      get_current_user_role() = 'manager'
      AND (
        team_id IN (
          SELECT id FROM teams 
          WHERE manager_id = auth.uid()
          AND is_active = true
        )
        OR team_id IS NULL
      )
    )
  )
);

-- Insert created invoices for managed teams
CREATE POLICY "Team-based insert for created invoices"
ON created_invoices
FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id()
  AND created_by = auth.uid()
  AND (
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    (
      get_current_user_role() = 'manager'
      AND (
        team_id IN (
          SELECT id FROM teams 
          WHERE manager_id = auth.uid()
          AND is_active = true
        )
        OR team_id IS NULL
      )
    )
  )
);

-- Update created invoices for managed teams
CREATE POLICY "Team-based update for created invoices"
ON created_invoices
FOR UPDATE
USING (
  organization_id = get_current_user_organization_id()
  AND (
    get_current_user_role() IN ('admin', 'superadmin')
    OR
    (
      get_current_user_role() = 'manager'
      AND (
        team_id IN (
          SELECT id FROM teams 
          WHERE manager_id = auth.uid()
          AND is_active = true
        )
        OR team_id IS NULL
      )
    )
  )
);