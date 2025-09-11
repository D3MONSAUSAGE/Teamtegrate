-- Add scheduled_days field to checklists table
ALTER TABLE public.checklists 
ADD COLUMN scheduled_days jsonb DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb;