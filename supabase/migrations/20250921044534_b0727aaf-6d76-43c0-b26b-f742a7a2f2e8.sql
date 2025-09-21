-- Add minimum and maximum quantity columns to inventory_template_items table
ALTER TABLE public.inventory_template_items 
ADD COLUMN minimum_quantity numeric DEFAULT NULL,
ADD COLUMN maximum_quantity numeric DEFAULT NULL;

-- Add check constraint to ensure logical quantity relationships
ALTER TABLE public.inventory_template_items 
ADD CONSTRAINT check_quantity_logic 
CHECK (
  (minimum_quantity IS NULL OR expected_quantity IS NULL OR minimum_quantity <= expected_quantity) AND
  (maximum_quantity IS NULL OR expected_quantity IS NULL OR expected_quantity <= maximum_quantity) AND
  (minimum_quantity IS NULL OR maximum_quantity IS NULL OR minimum_quantity <= maximum_quantity)
);