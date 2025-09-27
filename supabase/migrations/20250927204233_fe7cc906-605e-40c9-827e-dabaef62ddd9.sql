-- Add vendor_id foreign key to shipments table
ALTER TABLE public.shipments 
ADD COLUMN vendor_id UUID REFERENCES public.vendors(id);

-- Create index for better performance
CREATE INDEX idx_shipments_vendor_id ON public.shipments(vendor_id);

-- Update existing shipments to set vendor_id from supplier_info if possible
-- This will remain NULL for existing records, which is fine for backwards compatibility