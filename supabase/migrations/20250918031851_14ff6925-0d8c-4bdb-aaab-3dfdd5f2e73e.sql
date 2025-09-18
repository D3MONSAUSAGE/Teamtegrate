-- Add Google Tasks integration support to tasks table
ALTER TABLE public.tasks 
ADD COLUMN google_tasks_id TEXT,
ADD COLUMN source TEXT DEFAULT 'local' CHECK (source IN ('local', 'google_tasks', 'google_calendar', 'hybrid')),
ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add index for Google Tasks ID lookups
CREATE INDEX idx_tasks_google_tasks_id ON public.tasks(google_tasks_id) WHERE google_tasks_id IS NOT NULL;
CREATE INDEX idx_tasks_source ON public.tasks(source);

-- Update google_calendar_sync_preferences to include Google Tasks preferences
ALTER TABLE public.google_calendar_sync_preferences
ADD COLUMN sync_google_tasks BOOLEAN DEFAULT false,
ADD COLUMN import_google_tasks BOOLEAN DEFAULT false,
ADD COLUMN export_to_google_tasks BOOLEAN DEFAULT false;

-- Add Google Tasks API tokens to users table
ALTER TABLE public.users
ADD COLUMN google_tasks_token TEXT,
ADD COLUMN google_tasks_enabled BOOLEAN DEFAULT false;