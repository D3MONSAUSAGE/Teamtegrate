-- Fix warehouse reports issues

-- 1. First, let's clean up duplicate warehouse item settings by keeping only one per item
-- Delete duplicates, keeping only the first entry for each item
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY warehouse_id, item_id ORDER BY created_at) as rn
  FROM warehouse_item_settings 
  WHERE warehouse_id = 'f9484552-0597-4314-b6f1-5e0fad996c52'
)
DELETE FROM warehouse_item_settings 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Update the sample sales transactions to have proper profit margins
-- First delete the existing sample sales
DELETE FROM inventory_transactions 
WHERE reference_number LIKE 'SALE-%';

-- 3. Add realistic sales transactions with proper profit margins
-- Collagen peptides: cost $12.00, sell for $20.00, profit $8.00 per unit
-- Coke Can: cost $3.50, sell for $6.00, profit $2.50 per unit
INSERT INTO public.inventory_transactions (
  organization_id,
  warehouse_id,
  item_id,
  team_id,
  user_id,
  transaction_type,
  quantity,
  unit_cost,
  reference_number,
  transaction_date,
  notes
) VALUES
-- Canyon team sales (Collagen peptides)
(
  'a15218f7-9da3-440a-a985-2c65bcb86a08',
  'f9484552-0597-4314-b6f1-5e0fad996c52',
  '02f66d6b-4e8f-47eb-990e-ebe4faa22fa1',
  '75bddbb8-b044-4047-879c-26cad3cc2212',
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d',
  'out',
  -3,
  20.00,
  'SALE-001',
  '2025-09-29 10:30:00',
  'Canyon - Collagen peptides sale'
),
-- Canyon team sales (Coke Can)
(
  'a15218f7-9da3-440a-a985-2c65bcb86a08',
  'f9484552-0597-4314-b6f1-5e0fad996c52',
  '0d933590-977a-48f2-93bc-9b0d6c73b4c4',
  '75bddbb8-b044-4047-879c-26cad3cc2212',
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d',
  'out',
  -5,
  6.00,
  'SALE-002',
  '2025-09-29 11:15:00',
  'Canyon - Coke Can sale'
),
-- Yesterday's Canyon sales
(
  'a15218f7-9da3-440a-a985-2c65bcb86a08',
  'f9484552-0597-4314-b6f1-5e0fad996c52',
  '02f66d6b-4e8f-47eb-990e-ebe4faa22fa1',
  '75bddbb8-b044-4047-879c-26cad3cc2212',
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d',
  'out',
  -2,
  20.00,
  'SALE-003',
  '2025-09-28 15:45:00',
  'Canyon - Collagen peptides sale'
);