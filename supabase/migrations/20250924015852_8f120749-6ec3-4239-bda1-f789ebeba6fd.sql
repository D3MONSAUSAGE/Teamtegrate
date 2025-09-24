-- Normalize empty barcodes to null for consistent indexing
UPDATE public.inventory_items 
SET barcode = NULL 
WHERE barcode = '' OR trim(barcode) = '';

-- Add unique index on non-empty barcodes
CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_items_barcode
ON public.inventory_items (barcode)
WHERE barcode IS NOT NULL AND barcode <> '';

-- Add comment for clarity
COMMENT ON INDEX ux_inventory_items_barcode IS 'Ensures barcode uniqueness across active inventory items';