-- Fix the search_path for our new SKU validation function
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
$$ LANGUAGE plpgsql SET search_path = 'public';