-- First, let's fix the recent counts that have null team_id by assigning them to the correct team based on their template
UPDATE inventory_counts 
SET team_id = t.team_id 
FROM inventory_templates t
WHERE inventory_counts.template_id = t.id 
  AND inventory_counts.team_id IS NULL 
  AND t.team_id IS NOT NULL;

-- Let's also check that we have the right team ID for Canyon
-- The Canyon team should be: 75bddbb8-b044-4047-879c-26cad3cc2212