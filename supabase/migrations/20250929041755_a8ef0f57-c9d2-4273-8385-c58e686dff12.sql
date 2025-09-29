-- Add sample sales transactions to demonstrate sales revenue and profit functionality
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
-- Recent sales for Canyon team
(
  'a15218f7-9da3-440a-a985-2c65bcb86a08',
  'f9484552-0597-4314-b6f1-5e0fad996c52',
  '02f66d6b-4e8f-47eb-990e-ebe4faa22fa1',
  '75bddbb8-b044-4047-879c-26cad3cc2212',
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d',
  'out',
  -5,
  25.50,
  'SALE-001',
  '2025-09-28 14:30:00',
  'Customer sale - Canyon location'
),
(
  'a15218f7-9da3-440a-a985-2c65bcb86a08',
  'f9484552-0597-4314-b6f1-5e0fad996c52',
  '0d933590-977a-48f2-93bc-9b0d6c73b4c4',
  '75bddbb8-b044-4047-879c-26cad3cc2212',
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d',
  'out',
  -3,
  18.75,
  'SALE-002',
  '2025-09-28 15:45:00',
  'Customer sale - Canyon location'
),
-- Sales for Cocina team
(
  'a15218f7-9da3-440a-a985-2c65bcb86a08',
  'f9484552-0597-4314-b6f1-5e0fad996c52',
  '02f66d6b-4e8f-47eb-990e-ebe4faa22fa1',
  'b18229e3-39b0-4b20-87fc-97b7f2757a3d',
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d',
  'out',
  -8,
  25.50,
  'SALE-003',
  '2025-09-28 16:15:00',
  'Customer sale - Cocina location'
),
-- Sales for today
(
  'a15218f7-9da3-440a-a985-2c65bcb86a08',
  'f9484552-0597-4314-b6f1-5e0fad996c52',
  '02f66d6b-4e8f-47eb-990e-ebe4faa22fa1',
  '75bddbb8-b044-4047-879c-26cad3cc2212',
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d',
  'out',
  -4,
  25.50,
  'SALE-004',
  '2025-09-29 10:20:00',
  'Customer sale - Canyon location'
),
(
  'a15218f7-9da3-440a-a985-2c65bcb86a08',
  'f9484552-0597-4314-b6f1-5e0fad996c52',
  '0d933590-977a-48f2-93bc-9b0d6c73b4c4',
  'b18229e3-39b0-4b20-87fc-97b7f2757a3d',
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d',
  'out',
  -2,
  18.75,
  'SALE-005',
  '2025-09-29 11:30:00',
  'Customer sale - Cocina location'
),
-- More sales for Palmdale team
(
  'a15218f7-9da3-440a-a985-2c65bcb86a08',
  'f9484552-0597-4314-b6f1-5e0fad996c52',
  '02f66d6b-4e8f-47eb-990e-ebe4faa22fa1',
  'b60b5721-6411-4978-9b98-d2bfa9cba7be',
  '3cb3ba4f-0ae9-4906-bd68-7d02f687c82d',
  'out',
  -6,
  25.50,
  'SALE-006',
  '2025-09-28 13:45:00',
  'Customer sale - Palmdale location'
);