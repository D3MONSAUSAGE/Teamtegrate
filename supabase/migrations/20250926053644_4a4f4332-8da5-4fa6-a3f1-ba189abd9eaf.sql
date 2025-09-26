-- Add allows_attachments column to request_types table
ALTER TABLE public.request_types 
ADD COLUMN allows_attachments boolean NOT NULL DEFAULT false;