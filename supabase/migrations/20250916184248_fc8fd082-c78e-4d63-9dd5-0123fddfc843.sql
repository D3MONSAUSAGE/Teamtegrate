-- Phase 1: Create database triggers for automatic Google Calendar sync

-- Function to automatically sync meetings to Google Calendar
CREATE OR REPLACE FUNCTION auto_sync_meeting_to_google()
RETURNS TRIGGER AS $$
DECLARE
  user_has_google_sync BOOLEAN;
BEGIN
  -- Check if the organizer has Google Calendar sync enabled
  SELECT google_calendar_sync_enabled INTO user_has_google_sync
  FROM users 
  WHERE id = COALESCE(NEW.organizer_id, OLD.organizer_id)
  AND google_refresh_token IS NOT NULL;
  
  -- Only proceed if user has Google sync enabled
  IF user_has_google_sync = TRUE THEN
    -- For INSERT (new meetings)
    IF TG_OP = 'INSERT' THEN
      -- Set sync status to pending for automatic sync
      NEW.sync_status = 'pending';
      
      -- Log the sync request
      INSERT INTO calendar_sync_log (
        user_id,
        organization_id, 
        meeting_request_id,
        sync_type,
        status
      ) VALUES (
        NEW.organizer_id,
        NEW.organization_id,
        NEW.id,
        'export_to_google',
        'pending'
      );
      
      RETURN NEW;
      
    -- For UPDATE (meeting changes)  
    ELSIF TG_OP = 'UPDATE' THEN
      -- Only sync if important fields changed
      IF OLD.title IS DISTINCT FROM NEW.title 
         OR OLD.description IS DISTINCT FROM NEW.description
         OR OLD.start_time IS DISTINCT FROM NEW.start_time  
         OR OLD.end_time IS DISTINCT FROM NEW.end_time
         OR OLD.location IS DISTINCT FROM NEW.location
         OR OLD.status IS DISTINCT FROM NEW.status THEN
        
        -- Set sync status to pending for update
        NEW.sync_status = 'pending';
        
        -- Log the sync request
        INSERT INTO calendar_sync_log (
          user_id,
          organization_id,
          meeting_request_id, 
          sync_type,
          status,
          google_event_id
        ) VALUES (
          NEW.organizer_id,
          NEW.organization_id,
          NEW.id,
          CASE WHEN NEW.status = 'cancelled' THEN 'delete_google' ELSE 'update_google' END,
          'pending',
          NEW.google_event_id
        );
      END IF;
      
      RETURN NEW;
      
    -- For DELETE (cancelled meetings)
    ELSIF TG_OP = 'DELETE' THEN
      -- Log deletion sync request if there was a Google event
      IF OLD.google_event_id IS NOT NULL THEN
        INSERT INTO calendar_sync_log (
          user_id,
          organization_id,
          meeting_request_id,
          sync_type, 
          status,
          google_event_id
        ) VALUES (
          OLD.organizer_id,
          OLD.organization_id,
          OLD.id,
          'delete_google',
          'pending', 
          OLD.google_event_id
        );
      END IF;
      
      RETURN OLD;
    END IF;
  END IF;
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW; 
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic sync
DROP TRIGGER IF EXISTS meeting_auto_sync_trigger ON meeting_requests;
CREATE TRIGGER meeting_auto_sync_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON meeting_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_meeting_to_google();

-- Add Google Calendar webhook URL field to users table for push notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_webhook_id TEXT;

-- Create table for tracking Google Calendar sync preferences
CREATE TABLE IF NOT EXISTS google_calendar_sync_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  sync_enabled BOOLEAN DEFAULT TRUE,
  import_enabled BOOLEAN DEFAULT TRUE,
  two_way_sync_enabled BOOLEAN DEFAULT TRUE,
  calendar_id TEXT DEFAULT 'primary',
  sync_frequency_minutes INTEGER DEFAULT 15,
  conflict_resolution_strategy TEXT DEFAULT 'latest_wins' CHECK (conflict_resolution_strategy IN ('latest_wins', 'teamtegrate_wins', 'google_wins', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_google_sync_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_google_sync_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(user_id)
);

-- Enable RLS on sync preferences table
ALTER TABLE google_calendar_sync_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policy for sync preferences
CREATE POLICY "Users can manage their own sync preferences" ON google_calendar_sync_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for efficient lookups  
CREATE INDEX IF NOT EXISTS idx_google_sync_prefs_user ON google_calendar_sync_preferences(user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_google_sync_prefs_updated_at
  BEFORE UPDATE ON google_calendar_sync_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();