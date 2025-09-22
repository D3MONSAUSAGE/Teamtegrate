-- Assign some inventory records to teams for better filtering demonstration
-- This will make team filtering more meaningful

-- Assign 4 records to Canyon team (already has 1)
UPDATE inventory_counts 
SET team_id = '75bddbb8-b044-4047-879c-26cad3cc2212'
WHERE id IN (
  SELECT id FROM inventory_counts 
  WHERE team_id IS NULL 
  ORDER BY created_at DESC 
  LIMIT 4
);

-- Assign 4 records to Corp team  
UPDATE inventory_counts 
SET team_id = '59745b20-e6f1-4309-8e98-14444a009676'
WHERE id IN (
  SELECT id FROM inventory_counts 
  WHERE team_id IS NULL 
  ORDER BY created_at DESC 
  LIMIT 4
);

-- Assign 3 records to Cocina team
UPDATE inventory_counts 
SET team_id = 'b18229e3-39b0-4b20-87fc-97b7f2757a3d'
WHERE id IN (
  SELECT id FROM inventory_counts 
  WHERE team_id IS NULL 
  ORDER BY created_at DESC 
  LIMIT 3
);

-- Assign 3 records to Palmdale team
UPDATE inventory_counts 
SET team_id = 'b60b5721-6411-4978-9b98-d2bfa9cba7be'
WHERE id IN (
  SELECT id FROM inventory_counts 
  WHERE team_id IS NULL 
  ORDER BY created_at DESC 
  LIMIT 3
);

-- Leave some records unassigned for "All Teams" filtering demonstration