-- Fix 2: Clean up existing empty string SKUs and barcodes
-- This migration converts empty strings to NULL for data consistency

-- Update empty string SKUs to NULL
UPDATE inventory_items
SET sku = NULL
WHERE sku = '';

-- Update empty string barcodes to NULL (if any exist)
UPDATE inventory_items
SET barcode = NULL
WHERE barcode = '';

-- Log the cleanup for audit purposes
DO $$
DECLARE
  sku_count INTEGER;
  barcode_count INTEGER;
BEGIN
  -- Count how many SKUs were cleaned
  SELECT COUNT(*) INTO sku_count
  FROM inventory_items
  WHERE sku IS NULL;
  
  -- Count how many barcodes were cleaned
  SELECT COUNT(*) INTO barcode_count
  FROM inventory_items
  WHERE barcode IS NULL;
  
  RAISE NOTICE 'Cleanup complete: % items now have NULL SKUs, % items have NULL barcodes', sku_count, barcode_count;
END $$;