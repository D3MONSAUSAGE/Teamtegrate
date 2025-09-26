-- Create atomic increment function for inventory count items (without updated_at)
CREATE OR REPLACE FUNCTION bump_count_item_actual(
  p_count_id uuid,
  p_count_item_id uuid,
  p_delta integer
)
RETURNS TABLE (id uuid, actual_quantity numeric)
LANGUAGE sql
SECURITY INVOKER
AS $$
  UPDATE inventory_count_items ici
     SET actual_quantity = COALESCE(ici.actual_quantity, 0) + p_delta
   WHERE ici.count_id = p_count_id
     AND ici.id = p_count_item_id
  RETURNING ici.id, ici.actual_quantity;
$$;

-- Grant execute permission to authenticated users (RLS still applies)
GRANT EXECUTE ON FUNCTION bump_count_item_actual(uuid, uuid, integer) TO authenticated;