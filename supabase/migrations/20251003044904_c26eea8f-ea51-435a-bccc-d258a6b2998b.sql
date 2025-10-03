-- Add unit conversion and packaging snapshot columns to recipe_ingredients
ALTER TABLE recipe_ingredients
ADD COLUMN IF NOT EXISTS cost_per_base_unit numeric,
ADD COLUMN IF NOT EXISTS base_unit text,
ADD COLUMN IF NOT EXISTS packaging_info text,
ADD COLUMN IF NOT EXISTS purchase_price_snapshot numeric,
ADD COLUMN IF NOT EXISTS conversion_factor_snapshot numeric;

-- Backfill existing recipe_ingredients with calculated cost per base unit
UPDATE recipe_ingredients ri
SET 
  cost_per_base_unit = CASE 
    WHEN ii.conversion_factor IS NOT NULL AND ii.conversion_factor > 0 AND ii.purchase_price IS NOT NULL 
      THEN ii.purchase_price / ii.conversion_factor
    WHEN ii.purchase_price IS NOT NULL 
      THEN ii.purchase_price
    ELSE 0
  END,
  base_unit = ii.unit_of_measure,
  packaging_info = CASE 
    WHEN ii.purchase_unit IS NOT NULL AND ii.purchase_price IS NOT NULL
      THEN ii.purchase_unit || ' @ $' || ROUND(ii.purchase_price::numeric, 2)::text
    ELSE NULL
  END,
  purchase_price_snapshot = ii.purchase_price,
  conversion_factor_snapshot = ii.conversion_factor
FROM inventory_items ii
WHERE ri.item_id = ii.id
  AND ri.cost_per_base_unit IS NULL;