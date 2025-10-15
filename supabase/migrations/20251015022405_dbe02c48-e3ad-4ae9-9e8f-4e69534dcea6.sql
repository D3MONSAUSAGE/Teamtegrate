-- Fix 3: Enhanced trigger to normalize empty strings to NULL and prevent SKU modification
-- This provides database-level guarantee against empty string SKUs/barcodes

-- Drop existing trigger if it exists (checking both possible names)
DROP TRIGGER IF EXISTS prevent_sku_modification ON inventory_items;
DROP TRIGGER IF EXISTS prevent_sku_modification_trigger ON inventory_items;

-- Drop the old function with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS prevent_sku_modification() CASCADE;

-- Create improved trigger function that normalizes empty strings and prevents modification
CREATE OR REPLACE FUNCTION normalize_and_prevent_sku_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize empty strings to NULL for SKU
  IF NEW.sku IS NOT NULL AND TRIM(NEW.sku) = '' THEN
    NEW.sku := NULL;
  END IF;
  
  -- Normalize empty strings to NULL for barcode
  IF NEW.barcode IS NOT NULL AND TRIM(NEW.barcode) = '' THEN
    NEW.barcode := NULL;
  END IF;
  
  -- Prevent SKU modification if it was already set (only on UPDATE)
  IF TG_OP = 'UPDATE' AND OLD.sku IS NOT NULL AND NEW.sku IS DISTINCT FROM OLD.sku THEN
    RAISE EXCEPTION 'Cannot modify SKU once set. Current SKU: %, Attempted SKU: %', OLD.sku, NEW.sku;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that runs on both INSERT and UPDATE
CREATE TRIGGER prevent_sku_modification
  BEFORE INSERT OR UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION normalize_and_prevent_sku_modification();

-- Add comment for documentation
COMMENT ON FUNCTION normalize_and_prevent_sku_modification() IS 
  'Normalizes empty string SKUs/barcodes to NULL and prevents modification of existing SKUs';