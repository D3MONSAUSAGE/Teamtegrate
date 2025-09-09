-- Fix: add columns without referencing auth.users; use public.users
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS ticket_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS assigned_to UUID,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;

-- Optional: add FK to public.users if column types match
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id'
  ) THEN
    -- Create constraint only if not exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'requests_assigned_to_fkey'
    ) THEN
      ALTER TABLE public.requests
      ADD CONSTRAINT requests_assigned_to_fkey FOREIGN KEY (assigned_to)
      REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END$$;

-- Safer ticket generator using a dedicated sequence per year
CREATE TABLE IF NOT EXISTS ticket_counters (
  year TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  next_number INTEGER;
BEGIN
  -- Upsert the year row and increment atomically
  INSERT INTO ticket_counters(year, last_number)
  VALUES (current_year, 0)
  ON CONFLICT (year) DO NOTHING;

  UPDATE ticket_counters
  SET last_number = ticket_counters.last_number + 1
  WHERE year = current_year
  RETURNING last_number INTO next_number;

  RETURN 'REQ-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS requests_ticket_number_trigger ON public.requests;
CREATE TRIGGER requests_ticket_number_trigger
  BEFORE INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Backfill existing rows without a ticket number
UPDATE public.requests r
SET ticket_number = generate_ticket_number()
WHERE r.ticket_number IS NULL;