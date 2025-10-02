-- Ensure DoorDash is set to All Teams (team_id = NULL)
UPDATE sales_channels 
SET team_id = NULL, updated_at = NOW()
WHERE id = 'ddccb9ba-83ff-4d6d-9cf3-0e1101a89642';