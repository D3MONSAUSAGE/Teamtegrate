-- Add ticket number and assignment fields to requests table
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS ticket_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
  ticket_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN ticket_number ~ ('^REQ-' || current_year || '-[0-9]+$') 
      THEN CAST(SPLIT_PART(ticket_number, '-', 3) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1 INTO sequence_num
  FROM public.requests
  WHERE ticket_number IS NOT NULL;
  
  -- Format: REQ-YYYY-NNNN
  ticket_number := 'REQ-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN ticket_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-generate ticket numbers on insert
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS requests_ticket_number_trigger ON public.requests;
CREATE TRIGGER requests_ticket_number_trigger
  BEFORE INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Update existing requests without ticket numbers
UPDATE public.requests 
SET ticket_number = generate_ticket_number()
WHERE ticket_number IS NULL;