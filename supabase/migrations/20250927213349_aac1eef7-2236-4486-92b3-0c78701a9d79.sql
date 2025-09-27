-- Backfill team_id for existing sales transactions
-- First, let's see what data we have
SELECT 
  t.id,
  t.reference_number, 
  t.team_id,
  t.user_id,
  u.name as user_name,
  tm.team_id as user_team_id
FROM inventory_transactions t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN team_memberships tm ON t.user_id = tm.user_id
WHERE t.reference_number LIKE 'SALE%' 
  AND t.team_id IS NULL
ORDER BY t.created_at DESC
LIMIT 10;

-- Update sales transactions without team_id to use the user's primary team
UPDATE inventory_transactions 
SET team_id = (
  SELECT tm.team_id 
  FROM team_memberships tm 
  WHERE tm.user_id = inventory_transactions.user_id 
  LIMIT 1
)
WHERE reference_number LIKE 'SALE%' 
  AND team_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.user_id = inventory_transactions.user_id
  );

-- Also update other withdrawal types (waste, damage, etc.) for completeness
UPDATE inventory_transactions 
SET team_id = (
  SELECT tm.team_id 
  FROM team_memberships tm 
  WHERE tm.user_id = inventory_transactions.user_id 
  LIMIT 1
)
WHERE reference_number SIMILAR TO '(WASTE|DAMAGE|TRANSFER|SAMPLING|PROMOTION|OTHER)-%'
  AND team_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.user_id = inventory_transactions.user_id
  );