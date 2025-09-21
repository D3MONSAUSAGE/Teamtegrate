-- Rename expected_quantity to in_stock_quantity in inventory_template_items table
ALTER TABLE public.inventory_template_items 
RENAME COLUMN expected_quantity TO in_stock_quantity;

-- Rename expected_quantity to in_stock_quantity in inventory_count_items table  
ALTER TABLE public.inventory_count_items
RENAME COLUMN expected_quantity TO in_stock_quantity;

-- Update any existing indexes that reference the old column name
-- (The system will automatically handle index updates for renamed columns)