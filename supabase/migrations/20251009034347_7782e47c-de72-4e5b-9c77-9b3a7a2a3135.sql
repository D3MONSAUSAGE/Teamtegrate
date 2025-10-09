-- Phase 1: Delete Orphan Warehouses & Items
-- Step 1.1: Delete warehouse_items for orphan warehouses
DELETE FROM warehouse_items
WHERE warehouse_id IN (
  SELECT id FROM warehouses 
  WHERE team_id IS NULL
);

-- Step 1.2: Delete orphan warehouse records
DELETE FROM warehouses
WHERE team_id IS NULL;

-- Phase 2: Remove is_primary Field (Eliminate "Main Warehouse" Concept)
ALTER TABLE warehouses 
DROP COLUMN IF EXISTS is_primary;

-- Phase 3: Strengthen Database Constraints
-- Step 3.1: Make team_id NOT NULL
ALTER TABLE warehouses 
ALTER COLUMN team_id SET NOT NULL;

-- Step 3.2: Add unique constraint on (organization_id, name)
ALTER TABLE warehouses 
ADD CONSTRAINT warehouses_org_name_unique 
UNIQUE (organization_id, name);

-- Step 3.3: Update check constraint to ensure team_id exists
ALTER TABLE warehouses 
DROP CONSTRAINT IF EXISTS warehouses_team_id_required;

ALTER TABLE warehouses 
ADD CONSTRAINT warehouses_must_have_team 
CHECK (team_id IS NOT NULL);