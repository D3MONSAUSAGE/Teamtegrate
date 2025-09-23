-- Add unique constraint to inventory_items sku field (with cleanup of existing duplicates)

-- First, let's create a backup of items with duplicate SKUs
CREATE TABLE IF NOT EXISTS duplicate_sku_backup AS
SELECT * FROM inventory_items 
WHERE sku IN (
  SELECT sku 
  FROM inventory_items 
  WHERE sku IS NOT NULL AND sku != ''
  GROUP BY sku, organization_id 
  HAVING COUNT(*) > 1
);

-- Update duplicate SKUs by appending a sequential number to make them unique
WITH duplicate_skus AS (
  SELECT id, sku, organization_id,
         ROW_NUMBER() OVER (PARTITION BY sku, organization_id ORDER BY created_at) as rn
  FROM inventory_items 
  WHERE sku IS NOT NULL AND sku != ''
    AND sku IN (
      SELECT sku 
      FROM inventory_items 
      WHERE sku IS NOT NULL AND sku != ''
      GROUP BY sku, organization_id 
      HAVING COUNT(*) > 1
    )
)
UPDATE inventory_items 
SET sku = CASE 
  WHEN duplicate_skus.rn = 1 THEN duplicate_skus.sku
  ELSE duplicate_skus.sku || '-DUP' || duplicate_skus.rn::text
END
FROM duplicate_skus 
WHERE inventory_items.id = duplicate_skus.id;

-- Now add the unique constraint for SKU per organization
-- We create a partial unique index that only applies to non-null, non-empty SKUs
CREATE UNIQUE INDEX IF NOT EXISTS unique_sku_per_organization 
ON inventory_items (sku, organization_id) 
WHERE sku IS NOT NULL AND sku != '';

-- Create a function to validate SKU uniqueness
CREATE OR REPLACE FUNCTION validate_inventory_item_sku()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if SKU is provided and not empty
  IF NEW.sku IS NOT NULL AND trim(NEW.sku) != '' THEN
    -- Check for duplicates in the same organization
    IF EXISTS (
      SELECT 1 FROM inventory_items 
      WHERE sku = NEW.sku 
        AND organization_id = NEW.organization_id 
        AND id != COALESCE(NEW.id, gen_random_uuid())
    ) THEN
      RAISE EXCEPTION 'SKU "%" already exists in this organization', NEW.sku;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for SKU validation
DROP TRIGGER IF EXISTS trigger_validate_sku ON inventory_items;
CREATE TRIGGER trigger_validate_sku
  BEFORE INSERT OR UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_inventory_item_sku();