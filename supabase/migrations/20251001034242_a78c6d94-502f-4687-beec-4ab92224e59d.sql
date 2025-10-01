-- Add shelf life tracking to inventory items
ALTER TABLE public.inventory_items 
ADD COLUMN shelf_life_days integer;

COMMENT ON COLUMN public.inventory_items.shelf_life_days IS 'Number of days until product expires/spoils from production/receipt date';