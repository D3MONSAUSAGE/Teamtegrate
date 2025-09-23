-- Update the check_quantity_logic constraint to allow templates with 0 stock but valid min/max thresholds
ALTER TABLE inventory_template_items 
DROP CONSTRAINT IF EXISTS check_quantity_logic;

-- Add the updated constraint that allows in_stock_quantity to be less than minimum_quantity (for template scenarios)
ALTER TABLE inventory_template_items 
ADD CONSTRAINT check_quantity_logic CHECK (
  -- Min/Max relationship must be valid when both are not null
  ((minimum_quantity IS NULL) OR (maximum_quantity IS NULL) OR (minimum_quantity <= maximum_quantity))
  AND
  -- Stock can't exceed maximum when both are not null
  ((maximum_quantity IS NULL) OR (in_stock_quantity IS NULL) OR (in_stock_quantity <= maximum_quantity))
  -- Removed the minimum_quantity <= in_stock_quantity check to allow templates with 0 stock
);