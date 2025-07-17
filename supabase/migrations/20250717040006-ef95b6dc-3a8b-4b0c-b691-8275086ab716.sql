
-- Add task_id column to time_entries table to link time tracking to specific tasks
ALTER TABLE public.time_entries 
ADD COLUMN task_id TEXT REFERENCES public.tasks(id);

-- Create index for better performance when querying task-specific time entries
CREATE INDEX idx_time_entries_task_id ON public.time_entries(task_id);

-- Create index for active task sessions (where clock_out is null)
CREATE INDEX idx_time_entries_active_task ON public.time_entries(task_id, clock_out) WHERE clock_out IS NULL;
