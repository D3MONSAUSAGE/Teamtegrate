-- Fix security issues related to migration - enable RLS on ticket_counters table
ALTER TABLE public.ticket_counters ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for ticket_counters
CREATE POLICY "System can manage ticket counters" ON public.ticket_counters
FOR ALL USING (true);

-- Fix search path for new functions
DROP FUNCTION IF EXISTS generate_ticket_number();
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  next_number INTEGER;
BEGIN
  INSERT INTO public.ticket_counters(year, last_number)
  VALUES (current_year, 0)
  ON CONFLICT (year) DO NOTHING;

  UPDATE public.ticket_counters
  SET last_number = public.ticket_counters.last_number + 1
  WHERE year = current_year
  RETURNING last_number INTO next_number;

  RETURN 'REQ-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;