-- Clean up Main Warehouse legacy data
-- Main Warehouse ID: abaccdba-025e-49f1-bfbf-63696f2e1a80

-- Step 1: Delete warehouse items from Main Warehouse
DELETE FROM warehouse_items 
WHERE warehouse_id = 'abaccdba-025e-49f1-bfbf-63696f2e1a80';

-- Step 2: Delete warehouse receipts from Main Warehouse
DELETE FROM warehouse_receipts 
WHERE warehouse_id = 'abaccdba-025e-49f1-bfbf-63696f2e1a80';

-- Step 3: Delete the Main Warehouse record itself
DELETE FROM warehouses 
WHERE id = 'abaccdba-025e-49f1-bfbf-63696f2e1a80';

-- Step 4: Update inventory_items current_stock based on remaining warehouse stock
UPDATE inventory_items 
SET current_stock = COALESCE(
  (SELECT SUM(on_hand) 
   FROM warehouse_items 
   WHERE warehouse_items.item_id = inventory_items.id), 
  0
);

-- Step 5: Delete orphaned inventory_items that have no warehouse presence
DELETE FROM inventory_items 
WHERE id NOT IN (
  SELECT DISTINCT item_id 
  FROM warehouse_items 
  WHERE item_id IS NOT NULL
);