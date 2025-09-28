-- Drop triggers and functions that reference non-existent inventory_warehouse_items table
DROP TRIGGER IF EXISTS sync_template_to_warehouse_trigger ON public.inventory_template_items;
DROP FUNCTION IF EXISTS public.sync_template_minmax_to_warehouse();
DROP FUNCTION IF EXISTS public.create_inventory_transaction_from_receipt_line(uuid, uuid, numeric, text, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_warehouse_inventory_value(uuid);
DROP FUNCTION IF EXISTS public.get_real_time_inventory_value(uuid);