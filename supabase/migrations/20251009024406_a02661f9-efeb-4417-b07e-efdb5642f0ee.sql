-- Step 1: Add team_id column to production_recipes (nullable for migration)
ALTER TABLE production_recipes 
ADD COLUMN team_id uuid REFERENCES teams(id);

-- Step 2: Make user_id nullable (keep for audit trail)
ALTER TABLE production_recipes 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Backfill all existing recipes to Cocina team
UPDATE production_recipes 
SET team_id = 'b18229e3-39b0-4b20-87fc-97b7f2757a3d'
WHERE team_id IS NULL;

-- Step 4: Create index for performance
CREATE INDEX idx_production_recipes_team_id ON production_recipes(team_id);

-- Step 5: Drop old RLS policies
DROP POLICY IF EXISTS "Users can create recipes in their organization" ON production_recipes;
DROP POLICY IF EXISTS "Users can view recipes in their organization" ON production_recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON production_recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON production_recipes;

-- Step 6: Create new team-based RLS policies for production_recipes
CREATE POLICY "Team members can view their team's recipes"
ON production_recipes FOR SELECT
USING (
  organization_id = get_current_user_organization_id() AND
  (
    team_id IN (
      SELECT team_id FROM team_memberships WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'manager')
      AND organization_id = production_recipes.organization_id
    )
  )
);

CREATE POLICY "Team members can create recipes for their teams"
ON production_recipes FOR INSERT
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  team_id IN (
    SELECT team_id FROM team_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members and managers can update team recipes"
ON production_recipes FOR UPDATE
USING (
  organization_id = get_current_user_organization_id() AND
  (
    team_id IN (
      SELECT team_id FROM team_memberships WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'manager')
      AND organization_id = production_recipes.organization_id
    )
  )
);

CREATE POLICY "Managers and recipe creators can delete recipes"
ON production_recipes FOR DELETE
USING (
  organization_id = get_current_user_organization_id() AND
  (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'manager')
      AND organization_id = production_recipes.organization_id
    )
  )
);

-- Step 7: Update RLS policies for recipe_ingredients
DROP POLICY IF EXISTS "Users can view ingredients in their organization" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can create ingredients for their recipes" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can update their own recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can delete their own recipe ingredients" ON recipe_ingredients;

CREATE POLICY "Team members can view recipe ingredients"
ON recipe_ingredients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM production_recipes pr
    WHERE pr.id = recipe_ingredients.recipe_id
    AND pr.organization_id = get_current_user_organization_id()
    AND (
      pr.team_id IN (
        SELECT team_id FROM team_memberships WHERE user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin', 'manager')
        AND organization_id = pr.organization_id
      )
    )
  )
);

CREATE POLICY "Team members can create recipe ingredients"
ON recipe_ingredients FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM production_recipes pr
    WHERE pr.id = recipe_ingredients.recipe_id
    AND pr.organization_id = get_current_user_organization_id()
    AND pr.team_id IN (
      SELECT team_id FROM team_memberships WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Team members can update recipe ingredients"
ON recipe_ingredients FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM production_recipes pr
    WHERE pr.id = recipe_ingredients.recipe_id
    AND pr.organization_id = get_current_user_organization_id()
    AND (
      pr.team_id IN (
        SELECT team_id FROM team_memberships WHERE user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin', 'manager')
        AND organization_id = pr.organization_id
      )
    )
  )
);

CREATE POLICY "Team members can delete recipe ingredients"
ON recipe_ingredients FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM production_recipes pr
    WHERE pr.id = recipe_ingredients.recipe_id
    AND pr.organization_id = get_current_user_organization_id()
    AND (
      pr.team_id IN (
        SELECT team_id FROM team_memberships WHERE user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin', 'manager')
        AND organization_id = pr.organization_id
      )
    )
  )
);

-- Step 8: Update RLS policies for recipe_other_costs
DROP POLICY IF EXISTS "Users can view other costs in their organization" ON recipe_other_costs;
DROP POLICY IF EXISTS "Users can create other costs for their recipes" ON recipe_other_costs;
DROP POLICY IF EXISTS "Users can update their own recipe other costs" ON recipe_other_costs;
DROP POLICY IF EXISTS "Users can delete their own recipe other costs" ON recipe_other_costs;

CREATE POLICY "Team members can view recipe other costs"
ON recipe_other_costs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM production_recipes pr
    WHERE pr.id = recipe_other_costs.recipe_id
    AND pr.organization_id = get_current_user_organization_id()
    AND (
      pr.team_id IN (
        SELECT team_id FROM team_memberships WHERE user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin', 'manager')
        AND organization_id = pr.organization_id
      )
    )
  )
);

CREATE POLICY "Team members can create recipe other costs"
ON recipe_other_costs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM production_recipes pr
    WHERE pr.id = recipe_other_costs.recipe_id
    AND pr.organization_id = get_current_user_organization_id()
    AND pr.team_id IN (
      SELECT team_id FROM team_memberships WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Team members can update recipe other costs"
ON recipe_other_costs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM production_recipes pr
    WHERE pr.id = recipe_other_costs.recipe_id
    AND pr.organization_id = get_current_user_organization_id()
    AND (
      pr.team_id IN (
        SELECT team_id FROM team_memberships WHERE user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin', 'manager')
        AND organization_id = pr.organization_id
      )
    )
  )
);

CREATE POLICY "Team members can delete recipe other costs"
ON recipe_other_costs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM production_recipes pr
    WHERE pr.id = recipe_other_costs.recipe_id
    AND pr.organization_id = get_current_user_organization_id()
    AND (
      pr.team_id IN (
        SELECT team_id FROM team_memberships WHERE user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin', 'manager')
        AND organization_id = pr.organization_id
      )
    )
  )
);