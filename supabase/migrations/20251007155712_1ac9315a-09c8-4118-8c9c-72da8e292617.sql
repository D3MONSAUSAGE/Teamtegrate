-- Fix warehouse-team relationship: one team = one warehouse

-- Step 1: First, we need to handle any existing warehouses without team_id
-- Set a comment to track orphaned warehouses before cleanup
COMMENT ON TABLE warehouses IS 'Each team can have only ONE warehouse. Warehouses without team_id should be cleaned up manually.';

-- Step 2: Add unique constraint to ensure one warehouse per team
-- This will prevent creating duplicate warehouses for the same team
ALTER TABLE warehouses 
ADD CONSTRAINT warehouses_team_id_unique UNIQUE (team_id);

-- Step 3: Make team_id NOT NULL for new warehouses
-- Note: We cannot make existing NULL values NOT NULL without cleanup
-- So we add a check constraint that allows NULL for existing rows but 
-- the application layer will enforce team_id requirement for new warehouses
ALTER TABLE warehouses 
ADD CONSTRAINT warehouses_team_id_required 
CHECK (team_id IS NOT NULL OR created_at < NOW());

-- Step 4: Create function to check if team already has a warehouse
CREATE OR REPLACE FUNCTION check_team_warehouse_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for non-null team_id
  IF NEW.team_id IS NOT NULL THEN
    -- Check if team already has a warehouse
    IF EXISTS (
      SELECT 1 FROM warehouses 
      WHERE team_id = NEW.team_id 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Team already has a warehouse. Each team can only have one warehouse.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to enforce one warehouse per team
DROP TRIGGER IF EXISTS enforce_team_warehouse_limit ON warehouses;
CREATE TRIGGER enforce_team_warehouse_limit
  BEFORE INSERT OR UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION check_team_warehouse_limit();

-- Add helpful comment
COMMENT ON CONSTRAINT warehouses_team_id_unique ON warehouses IS 
'Ensures each team can only have one warehouse. This is a business rule constraint.';