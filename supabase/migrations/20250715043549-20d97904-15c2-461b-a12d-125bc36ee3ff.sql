
-- Add scheduled_start and scheduled_end columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN scheduled_start timestamp with time zone,
ADD COLUMN scheduled_end timestamp with time zone;

-- Add a comment to explain the new columns
COMMENT ON COLUMN public.tasks.scheduled_start IS 'Optional scheduled start time for the task';
COMMENT ON COLUMN public.tasks.scheduled_end IS 'Optional scheduled end time for the task';

-- Create an index for better performance when querying by scheduled times
CREATE INDEX idx_tasks_scheduled_times ON public.tasks(scheduled_start, scheduled_end) WHERE scheduled_start IS NOT NULL;
