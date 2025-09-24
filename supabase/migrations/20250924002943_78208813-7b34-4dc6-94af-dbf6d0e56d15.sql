-- Clear any empty string barcodes first, then add unique constraint
UPDATE public.inventory_items 
SET barcode = NULL 
WHERE barcode = '' OR barcode IS NULL;

-- Add barcode field (already exists, so this will be ignored)
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS barcode text;

-- Create unique index on barcode (excluding nulls)
CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_items_barcode 
ON public.inventory_items (barcode) 
WHERE barcode IS NOT NULL AND barcode != '';