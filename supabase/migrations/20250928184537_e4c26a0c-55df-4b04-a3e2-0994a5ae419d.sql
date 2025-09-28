-- Drop functions using their specific signatures
DROP FUNCTION public.get_daily_movements(uuid,date,uuid,uuid) CASCADE;
DROP FUNCTION public.get_warehouse_daily_movements(uuid,uuid,date) CASCADE;  
DROP FUNCTION public.get_real_time_inventory_value(uuid,uuid) CASCADE;

-- Check if inventory_items has warehouse_id or if we should use transactions.warehouse_id
-- First let's create a simple function to test what columns exist
CREATE FUNCTION test_inventory_schema()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  result text := '';
BEGIN
  -- Test if inventory_items has warehouse_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_items' 
    AND table_schema = 'public' 
    AND column_name = 'warehouse_id'
  ) THEN
    result := result || 'inventory_items.warehouse_id exists; ';
  END IF;
  
  -- Test if inventory_transactions has warehouse_id  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_transactions' 
    AND table_schema = 'public' 
    AND column_name = 'warehouse_id'
  ) THEN
    result := result || 'inventory_transactions.warehouse_id exists; ';
  END IF;
  
  RETURN result;
END;
$$;