-- Fix the recent Cocina count to assign it to the Cocina team so it appears in daily view
UPDATE inventory_counts 
SET team_id = 'b18229e3-39b0-4b20-87fc-97b7f2757a3d' 
WHERE id = 'a9ca46e6-a553-4142-9d3f-b2c1a74e72eb';