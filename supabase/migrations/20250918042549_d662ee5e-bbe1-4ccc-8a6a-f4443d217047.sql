-- Add missing columns to google_calendar_sync_preferences table to match component expectations
ALTER TABLE public.google_calendar_sync_preferences 
ADD COLUMN IF NOT EXISTS sync_meetings boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sync_bidirectional boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS default_meeting_duration integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS auto_create_meet_links boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sync_meeting_participants boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS import_external_events boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sync_frequency text DEFAULT 'realtime',
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"sync_success": true, "sync_errors": true}'::jsonb;

-- Create function to automatically create default preferences when user connects Google Calendar
CREATE OR REPLACE FUNCTION public.create_default_google_sync_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default sync preferences when a user gets Google tokens
  INSERT INTO public.google_calendar_sync_preferences (
    user_id,
    organization_id,
    sync_meetings,
    sync_bidirectional,
    default_meeting_duration,
    auto_create_meet_links,
    sync_meeting_participants,
    import_external_events,
    sync_frequency,
    notification_preferences,
    sync_tasks,
    sync_task_deadlines,
    sync_focus_time,
    sync_task_reminders,
    focus_time_duration,
    focus_time_advance_days,
    sync_google_tasks,
    import_google_tasks,
    export_to_google_tasks
  ) VALUES (
    NEW.id,
    NEW.organization_id,
    true,  -- sync_meetings
    false, -- sync_bidirectional
    60,    -- default_meeting_duration
    true,  -- auto_create_meet_links
    true,  -- sync_meeting_participants
    false, -- import_external_events
    'realtime', -- sync_frequency
    '{"sync_success": true, "sync_errors": true}'::jsonb, -- notification_preferences
    false, -- sync_tasks
    true,  -- sync_task_deadlines
    false, -- sync_focus_time
    false, -- sync_task_reminders
    120,   -- focus_time_duration
    2,     -- focus_time_advance_days
    false, -- sync_google_tasks
    false, -- import_google_tasks
    false  -- export_to_google_tasks
  )
  ON CONFLICT (user_id) DO NOTHING; -- Don't overwrite existing preferences
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create preferences when user gets Google tokens
DROP TRIGGER IF EXISTS create_google_sync_preferences_on_token ON public.users;
CREATE TRIGGER create_google_sync_preferences_on_token
  AFTER UPDATE OF google_refresh_token ON public.users
  FOR EACH ROW
  WHEN (NEW.google_refresh_token IS NOT NULL AND OLD.google_refresh_token IS NULL)
  EXECUTE FUNCTION public.create_default_google_sync_preferences();

-- Also create preferences for existing connected users
INSERT INTO public.google_calendar_sync_preferences (
  user_id,
  organization_id,
  sync_meetings,
  sync_bidirectional,
  default_meeting_duration,
  auto_create_meet_links,
  sync_meeting_participants,
  import_external_events,
  sync_frequency,
  notification_preferences,
  sync_tasks,
  sync_task_deadlines,
  sync_focus_time,
  sync_task_reminders,
  focus_time_duration,
  focus_time_advance_days,
  sync_google_tasks,
  import_google_tasks,
  export_to_google_tasks
)
SELECT 
  id,
  organization_id,
  true,  -- sync_meetings
  false, -- sync_bidirectional
  60,    -- default_meeting_duration
  true,  -- auto_create_meet_links
  true,  -- sync_meeting_participants
  false, -- import_external_events
  'realtime', -- sync_frequency
  '{"sync_success": true, "sync_errors": true}'::jsonb, -- notification_preferences
  false, -- sync_tasks
  true,  -- sync_task_deadlines
  false, -- sync_focus_time
  false, -- sync_task_reminders
  120,   -- focus_time_duration
  2,     -- focus_time_advance_days
  false, -- sync_google_tasks
  false, -- import_google_tasks
  false  -- export_to_google_tasks
FROM public.users 
WHERE google_refresh_token IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;