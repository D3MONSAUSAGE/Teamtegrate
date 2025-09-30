-- Add warehouse_id column to created_invoices table
ALTER TABLE public.created_invoices 
ADD COLUMN warehouse_id UUID REFERENCES public.warehouses(id);

-- Create index for performance on warehouse_id and invoice number lookups
CREATE INDEX idx_created_invoices_warehouse_year 
ON public.created_invoices(warehouse_id, invoice_number);

-- Add comment for documentation
COMMENT ON COLUMN public.created_invoices.warehouse_id IS 'Links invoice to specific warehouse for sequential numbering per warehouse';