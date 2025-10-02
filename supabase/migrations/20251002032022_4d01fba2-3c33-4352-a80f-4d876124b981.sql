-- Fix DoorDash sales channel to be available for All Teams
UPDATE sales_channels 
SET team_id = NULL 
WHERE name = 'DoorDash' 
AND team_id IS NOT NULL;