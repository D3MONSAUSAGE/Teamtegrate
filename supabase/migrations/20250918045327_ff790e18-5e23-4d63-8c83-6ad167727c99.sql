-- Fix the auto sync function with proper variable handling

CREATE OR REPLACE FUNCTION auto_sync_meeting_to_google()
RETURNS TRIGGER AS $$
DECLARE
  user_has_google_sync BOOLEAN := FALSE;
  google_refresh_token_exists BOOLEAN := FALSE;
  sync_enabled_pref BOOLEAN := TRUE;
BEGIN
  -- Check if the organizer has Google Calendar sync enabled and preferences
  SELECT 
    u.google_calendar_sync_enabled,
    (u.google_refresh_token IS NOT NULL),
    COALESCE(gsp.sync_enabled, TRUE)
  INTO user_has_google_sync, google_refresh_token_exists, sync_enabled_pref
  FROM users u
  LEFT JOIN google_calendar_sync_preferences gsp ON gsp.user_id = u.id
  WHERE u.id = COALESCE(NEW.organizer_id, OLD.organizer_id);
  
  -- User has Google sync if they have all required conditions
  user_has_google_sync := (
    user_has_google_sync = TRUE AND 
    google_refresh_token_exists = TRUE AND
    sync_enabled_pref = TRUE
  );
  
  -- Only proceed if user has Google sync enabled
  IF user_has_google_sync = TRUE THEN
    -- For INSERT (new meetings)
    IF TG_OP = 'INSERT' THEN
      -- Set sync status to pending for automatic sync
      NEW.sync_status = 'pending';
      
      -- Log the sync request with better tracking
      INSERT INTO calendar_sync_log (
        user_id,
        organization_id, 
        meeting_request_id,
        sync_type,
        status,
        created_at,
        updated_at
      ) VALUES (
        NEW.organizer_id,
        NEW.organization_id,
        NEW.id,
        'export_to_google',
        'pending',
        now(),
        now()
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
          google_event_id,
          created_at,
          updated_at
        ) VALUES (
          NEW.organizer_id,
          NEW.organization_id,
          NEW.id,
          CASE WHEN NEW.status = 'cancelled' THEN 'delete_google' ELSE 'update_google' END,
          'pending',
          NEW.google_event_id,
          now(),
          now()
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
          google_event_id,
          created_at,
          updated_at
        ) VALUES (
          OLD.organizer_id,
          OLD.organization_id,
          OLD.id,
          'delete_google',
          'pending', 
          OLD.google_event_id,
          now(),
          now()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add sync queue processing trigger to automatically process pending sync requests
CREATE OR REPLACE FUNCTION process_sync_queue_automatically()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if this is a new pending sync request
  IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
    -- Invoke the sync processing function asynchronously
    PERFORM pg_notify('calendar_sync_queue', 
      json_build_object(
        'sync_log_id', NEW.id,
        'sync_type', NEW.sync_type,
        'meeting_request_id', NEW.meeting_request_id,
        'user_id', NEW.user_id
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic sync queue processing
DROP TRIGGER IF EXISTS auto_process_sync_queue_trigger ON calendar_sync_log;
CREATE TRIGGER auto_process_sync_queue_trigger
  AFTER INSERT OR UPDATE ON calendar_sync_log
  FOR EACH ROW
  EXECUTE FUNCTION process_sync_queue_automatically();