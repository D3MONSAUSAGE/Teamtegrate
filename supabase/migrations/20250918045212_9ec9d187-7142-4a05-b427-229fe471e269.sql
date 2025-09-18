-- Add sync queue processing trigger to automatically process pending sync requests

-- Function to process calendar sync queue automatically 
CREATE OR REPLACE FUNCTION process_sync_queue_automatically()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if this is a new pending sync request
  IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
    -- Invoke the sync processing function asynchronously
    -- Note: In real implementation, this would trigger a background job
    -- For now, we'll add a notification to process the queue
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

-- Add email validation and Google account matching function
CREATE OR REPLACE FUNCTION validate_participant_emails()
RETURNS TRIGGER AS $$
DECLARE
  participant_record RECORD;
  user_email TEXT;
  validation_warnings TEXT[] := '{}';
BEGIN
  -- For meeting participant insertions, validate emails
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'meeting_participants' THEN
    -- Get user email
    SELECT email INTO user_email 
    FROM users 
    WHERE id = NEW.user_id;
    
    -- Add warning if email format might not work with Google Calendar
    IF user_email IS NOT NULL AND user_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      validation_warnings := array_append(validation_warnings, 'Invalid email format for participant: ' || user_email);
    END IF;
    
    -- Store validation warnings in meeting request for organizer review
    IF array_length(validation_warnings, 1) > 0 THEN
      UPDATE meeting_requests 
      SET description = COALESCE(description, '') || E'\n\nWarnings: ' || array_to_string(validation_warnings, '; ')
      WHERE id = NEW.meeting_request_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for participant email validation
DROP TRIGGER IF EXISTS validate_participant_emails_trigger ON meeting_participants;
CREATE TRIGGER validate_participant_emails_trigger
  AFTER INSERT ON meeting_participants
  FOR EACH ROW
  EXECUTE FUNCTION validate_participant_emails();

-- Function to get meeting sync status with details
CREATE OR REPLACE FUNCTION get_meeting_sync_status(meeting_id UUID)
RETURNS TABLE(
  sync_status TEXT,
  google_event_id TEXT,
  google_meet_url TEXT,
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  sync_error TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.sync_status::TEXT,
    mr.google_event_id::TEXT,
    mr.google_meet_url::TEXT,
    csl.created_at as last_sync_attempt,
    csl.error_message::TEXT as sync_error
  FROM meeting_requests mr
  LEFT JOIN calendar_sync_log csl ON csl.meeting_request_id = mr.id
  WHERE mr.id = meeting_id
  ORDER BY csl.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the auto sync function to be more robust
CREATE OR REPLACE FUNCTION auto_sync_meeting_to_google()
RETURNS TRIGGER AS $$
DECLARE
  user_has_google_sync BOOLEAN := FALSE;
  sync_preferences RECORD;
BEGIN
  -- Check if the organizer has Google Calendar sync enabled and preferences
  SELECT 
    u.google_calendar_sync_enabled,
    u.google_refresh_token,
    gsp.sync_enabled,
    gsp.id as pref_id
  INTO user_has_google_sync, sync_preferences
  FROM users u
  LEFT JOIN google_calendar_sync_preferences gsp ON gsp.user_id = u.id
  WHERE u.id = COALESCE(NEW.organizer_id, OLD.organizer_id);
  
  -- User has Google sync if they have tokens AND preferences allow it
  user_has_google_sync := (
    sync_preferences IS NOT NULL AND 
    user_has_google_sync = TRUE AND 
    sync_preferences IS NOT NULL AND
    COALESCE(sync_preferences, TRUE) = TRUE
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