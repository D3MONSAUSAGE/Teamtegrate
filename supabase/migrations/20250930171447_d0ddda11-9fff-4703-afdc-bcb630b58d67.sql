-- Phase 1: Fix team_id and location inconsistency in sales_data

-- First, ensure all existing records have a team_id based on their location
-- This maps location strings to team_ids for existing data
UPDATE sales_data sd
SET team_id = t.id
FROM teams t
WHERE sd.team_id IS NULL 
  AND sd.organization_id = t.organization_id
  AND (
    sd.location = t.name 
    OR sd.location ILIKE '%' || t.name || '%'
  );

-- For any remaining records without team_id, create a default team or set to first team
UPDATE sales_data sd
SET team_id = (
  SELECT id FROM teams 
  WHERE organization_id = sd.organization_id 
  LIMIT 1
)
WHERE sd.team_id IS NULL;

-- Now make team_id non-nullable
ALTER TABLE sales_data 
ALTER COLUMN team_id SET NOT NULL;

-- Add composite index for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_data_org_team_date 
ON sales_data(organization_id, team_id, date DESC);

-- Add index for date-based queries
CREATE INDEX IF NOT EXISTS idx_sales_data_date_team 
ON sales_data(date DESC, team_id);

-- Add constraint to ensure location matches team name for data consistency
-- (This is a soft constraint - we'll enforce it in application logic)

-- Create a function to get team name from team_id for consistency
CREATE OR REPLACE FUNCTION get_team_name_for_sales(p_team_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT name FROM teams WHERE id = p_team_id;
$$;

COMMENT ON TABLE sales_data IS 'Daily sales data records. team_id is required and should match the team name in location field.';
COMMENT ON COLUMN sales_data.team_id IS 'Required reference to teams table. Used for filtering and organization.';
COMMENT ON COLUMN sales_data.location IS 'Descriptive location/team name. Should match team name for consistency.';