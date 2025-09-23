-- Fix the stuck inventory count and template issues

-- First, add the missing item to the template
INSERT INTO inventory_template_items (
  template_id,
  item_id,
  minimum_quantity,
  maximum_quantity,
  sort_order
) VALUES (
  'a7c94b80-da57-4c7b-8bca-bd9f70ae20fd', -- Inventario producto preparado template
  '36388f84-ef5e-4c7d-91c7-2ab6871b4d48', -- ASADA RES PICADA item
  5,  -- minimum quantity
  20, -- maximum quantity  
  1   -- sort order
) ON CONFLICT (template_id, item_id) DO UPDATE SET
  minimum_quantity = EXCLUDED.minimum_quantity,
  maximum_quantity = EXCLUDED.maximum_quantity,
  sort_order = EXCLUDED.sort_order;

-- Fix the stuck count by linking it to the template
UPDATE inventory_counts 
SET 
  template_id = 'a7c94b80-da57-4c7b-8bca-bd9f70ae20fd',
  total_items_count = 1
WHERE id = '3c8f96a9-208a-43e5-9401-d77e84431624';

-- Create the missing count item for the stuck count
INSERT INTO inventory_count_items (
  count_id,
  item_id,
  expected_quantity,
  actual_quantity,
  minimum_threshold,
  maximum_threshold,
  notes
) VALUES (
  '3c8f96a9-208a-43e5-9401-d77e84431624', -- stuck count id
  '36388f84-ef5e-4c7d-91c7-2ab6871b4d48', -- ASADA RES PICADA item
  0,  -- expected quantity (to be updated during counting)
  0,  -- actual quantity (to be filled by user)
  5,  -- minimum threshold from template
  20, -- maximum threshold from template
  'Added retroactively to fix stuck count'
) ON CONFLICT (count_id, item_id) DO NOTHING;