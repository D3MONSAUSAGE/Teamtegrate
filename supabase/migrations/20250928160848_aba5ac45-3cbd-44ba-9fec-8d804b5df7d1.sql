-- Enable real-time for warehouse tables
ALTER TABLE public.warehouse_items REPLICA IDENTITY FULL;
ALTER TABLE public.warehouse_receipts REPLICA IDENTITY FULL;
ALTER TABLE public.warehouse_receipt_lines REPLICA IDENTITY FULL;

-- Add tables to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.warehouse_receipt_lines;