-- Fix missing sale prices for existing inventory items
-- Set sale_price to cost + 40% margin where sale_price is null and unit_cost exists
UPDATE inventory_items 
SET sale_price = COALESCE(unit_cost * 1.4, 0)
WHERE sale_price IS NULL 
  AND unit_cost IS NOT NULL 
  AND unit_cost > 0;

-- Set sale_price to at least $1 for items with zero or null cost
UPDATE inventory_items 
SET sale_price = 1.00
WHERE sale_price IS NULL 
  AND (unit_cost IS NULL OR unit_cost <= 0);

-- Ensure warehouse items also have sale prices synced
UPDATE warehouse_items 
SET sale_price = (
  SELECT COALESCE(i.sale_price, i.unit_cost * 1.4, 1.00)
  FROM inventory_items i 
  WHERE i.id = warehouse_items.item_id
)
WHERE sale_price IS NULL;