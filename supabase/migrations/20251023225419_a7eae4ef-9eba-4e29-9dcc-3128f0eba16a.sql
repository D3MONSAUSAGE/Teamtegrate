-- Add item_id column to manufacturing_batches table
ALTER TABLE manufacturing_batches 
ADD COLUMN item_id uuid REFERENCES inventory_items(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_manufacturing_batches_item_id 
ON manufacturing_batches(item_id);

-- Add helpful comment
COMMENT ON COLUMN manufacturing_batches.item_id IS 'Direct reference to the product being manufactured in this batch';