-- Create email_events table for meeting email idempotency
CREATE TABLE IF NOT EXISTS public.email_events (
  idempotency_key text PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('in_progress','sent','failed')),
  payload jsonb NOT NULL,
  last_error text
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON public.email_events(created_at);
CREATE INDEX IF NOT EXISTS idx_email_events_status ON public.email_events(status);