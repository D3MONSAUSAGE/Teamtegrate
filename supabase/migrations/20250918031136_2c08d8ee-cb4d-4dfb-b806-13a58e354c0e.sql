-- Add task sync preferences to the google_calendar_sync_preferences table
ALTER TABLE public.google_calendar_sync_preferences 
ADD COLUMN IF NOT EXISTS sync_tasks BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sync_task_deadlines BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS sync_focus_time BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sync_task_reminders BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS focus_time_duration INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS focus_time_advance_days INTEGER DEFAULT 2;

-- Add Google Calendar event ID columns to tasks table for different sync types
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS google_event_id_deadline TEXT,
ADD COLUMN IF NOT EXISTS google_event_id_focus_time TEXT,
ADD COLUMN IF NOT EXISTS google_event_id_reminder TEXT;