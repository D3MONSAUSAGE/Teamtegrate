-- Create shipments table for tracking incoming deliveries
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  shipment_number TEXT NOT NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_info JSONB DEFAULT '{}'::jsonb,
  reference_number TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Create policies for shipments
CREATE POLICY "Users can view shipments in their organization" 
ON public.shipments 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create shipments in their organization" 
ON public.shipments 
FOR INSERT 
WITH CHECK (organization_id = get_current_user_organization_id() AND created_by = auth.uid());

CREATE POLICY "Users can update shipments in their organization" 
ON public.shipments 
FOR UPDATE 
USING (organization_id = get_current_user_organization_id())
WITH CHECK (organization_id = get_current_user_organization_id());

-- Add shipment_id to inventory_lots table
ALTER TABLE public.inventory_lots 
ADD COLUMN shipment_id UUID REFERENCES public.shipments(id);

-- Create index for better performance
CREATE INDEX idx_inventory_lots_shipment_id ON public.inventory_lots(shipment_id);
CREATE INDEX idx_shipments_organization_id ON public.shipments(organization_id);
CREATE INDEX idx_shipments_received_date ON public.shipments(received_date);

-- Add trigger for timestamps
CREATE TRIGGER update_shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate shipment numbers
CREATE OR REPLACE FUNCTION generate_shipment_number(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  date_part TEXT;
  sequence_part INTEGER;
  shipment_number TEXT;
BEGIN
  date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(shipment_number FROM 'SHIP-\d{8}-(\d+)') AS INTEGER)), 0) + 1
  INTO sequence_part
  FROM public.shipments
  WHERE organization_id = org_id
  AND received_date = CURRENT_DATE;
  
  shipment_number := 'SHIP-' || date_part || '-' || LPAD(sequence_part::TEXT, 3, '0');
  
  RETURN shipment_number;
END;
$$;