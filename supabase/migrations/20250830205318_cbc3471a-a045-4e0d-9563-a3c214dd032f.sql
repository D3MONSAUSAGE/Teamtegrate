-- Add warning_period_hours field to tasks table
ALTER TABLE public.tasks 
ADD COLUMN warning_period_hours INTEGER DEFAULT 24;