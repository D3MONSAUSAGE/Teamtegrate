-- Add Google Calendar integration fields to meeting_requests table
ALTER TABLE meeting_requests 
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS google_meet_url TEXT,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';

-- Add Google Calendar tokens to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_calendar_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_sync_enabled BOOLEAN DEFAULT false;

-- Create calendar sync status tracking table
CREATE TABLE IF NOT EXISTS public.calendar_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  meeting_request_id UUID REFERENCES meeting_requests(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'export_to_google', 'import_from_google', 'update_google', 'delete_google'
  google_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for calendar_sync_log
ALTER TABLE public.calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_sync_log
CREATE POLICY "Users can view their own sync logs"
ON public.calendar_sync_log FOR SELECT
USING (user_id = auth.uid() AND organization_id = get_current_user_organization_id());

CREATE POLICY "System can create sync logs"
ON public.calendar_sync_log FOR INSERT
WITH CHECK (organization_id = get_current_user_organization_id());

CREATE POLICY "System can update sync logs"
ON public.calendar_sync_log FOR UPDATE
USING (organization_id = get_current_user_organization_id());

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_calendar_sync_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_sync_log_updated_at
  BEFORE UPDATE ON public.calendar_sync_log
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_sync_log_updated_at();