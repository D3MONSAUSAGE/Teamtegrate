
-- Danger: Permanently deletes ALL sales data across all organizations
BEGIN;
  DELETE FROM public.sales_data;
COMMIT;
