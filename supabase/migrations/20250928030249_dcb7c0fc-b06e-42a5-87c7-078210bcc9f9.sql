-- Remove wac_unit_cost column and add sale_price column to warehouse_items
ALTER TABLE public.warehouse_items 
DROP COLUMN IF EXISTS wac_unit_cost,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2) DEFAULT NULL;