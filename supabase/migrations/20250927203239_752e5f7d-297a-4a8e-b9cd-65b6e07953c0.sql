-- Fix the security warning for the generate_shipment_number function
CREATE OR REPLACE FUNCTION generate_shipment_number(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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