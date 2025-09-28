-- Clean up legacy current_stock data from product catalog
-- Set all current_stock to 0 as it should only be maintained in warehouse_items table
UPDATE public.inventory_items 
SET current_stock = 0 
WHERE current_stock != 0;

-- Add comment to clarify that current_stock should not be used
COMMENT ON COLUMN public.inventory_items.current_stock IS 'DEPRECATED: Use inventory_warehouse_items.on_hand for actual stock levels. This field should remain 0 as items are a product catalog only.';