-- Backfill team_id from location where location contains UUID
-- This fixes existing sales data that has team IDs stored in location field
UPDATE public.sales_data 
SET team_id = location::uuid
WHERE team_id IS NULL 
  AND location ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Update location field to show human-readable team names
UPDATE public.sales_data 
SET location = (
  SELECT COALESCE(t.name, 'Unknown Team')
  FROM public.teams t 
  WHERE t.id = sales_data.team_id
)
WHERE team_id IS NOT NULL;