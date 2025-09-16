-- Fix the search path security warning for our new function
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
$$ LANGUAGE plpgsql SET search_path = public;