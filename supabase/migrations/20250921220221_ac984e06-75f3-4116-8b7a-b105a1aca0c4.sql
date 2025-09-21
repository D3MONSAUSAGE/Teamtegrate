-- Add email_sent_at column to inventory_counts table for email notification idempotency
ALTER TABLE public.inventory_counts 
ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE NULL;