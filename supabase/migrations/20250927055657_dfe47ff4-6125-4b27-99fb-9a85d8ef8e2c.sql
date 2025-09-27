-- Add sale_price column to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN sale_price NUMERIC(10,2) NULL;

-- Add comment to document the field
COMMENT ON COLUMN public.inventory_items.sale_price IS 'Optional sale price for profit calculation and sales transactions';