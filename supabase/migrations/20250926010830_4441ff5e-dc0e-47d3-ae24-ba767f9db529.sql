-- Create atomic increment function with scope validation
CREATE OR REPLACE FUNCTION bump_count_item_actual(
  p_count_id UUID,
  p_item_id UUID, 
  p_delta NUMERIC
) RETURNS TABLE(new_actual NUMERIC, count_item_id UUID) AS $$
DECLARE
  result_actual NUMERIC;
  result_count_item_id UUID;
BEGIN
  -- Validate that the item belongs to this count
  SELECT id INTO result_count_item_id 
  FROM inventory_count_items 
  WHERE count_id = p_count_id AND item_id = p_item_id;
  
  IF result_count_item_id IS NULL THEN
    RAISE EXCEPTION 'Item not in this count' USING ERRCODE = 'P0001';
  END IF;
  
  -- Atomic increment with proper locking
  UPDATE inventory_count_items 
  SET 
    actual_quantity = COALESCE(actual_quantity, 0) + p_delta,
    counted_at = now(),
    updated_at = now()
  WHERE id = result_count_item_id
  RETURNING actual_quantity INTO result_actual;
  
  RETURN QUERY SELECT result_actual, result_count_item_id;
END;
$$ LANGUAGE plpgsql;