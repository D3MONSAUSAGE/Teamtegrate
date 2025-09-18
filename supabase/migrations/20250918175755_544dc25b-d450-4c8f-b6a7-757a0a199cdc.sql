-- Phase 1: Fix Database Trigger Issues

-- 1. Create the missing auto sync trigger with proper AFTER timing
DROP TRIGGER IF EXISTS meeting_auto_sync_trigger ON meeting_requests;

CREATE TRIGGER meeting_auto_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON meeting_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_meeting_to_google();

-- 2. Fix trigger validation function to handle missing meeting records gracefully
CREATE OR REPLACE FUNCTION validate_meeting_sync_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if meeting_request_id is provided
  IF NEW.meeting_request_id IS NOT NULL THEN
    -- Check if meeting exists before allowing sync log entry
    IF NOT EXISTS (
      SELECT 1 FROM meeting_requests 
      WHERE id = NEW.meeting_request_id
    ) THEN
      -- Log the issue but don't fail - meeting might be in process of creation
      RAISE LOG 'Calendar sync log created for meeting % which does not exist yet', NEW.meeting_request_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update the auto sync function to handle errors gracefully
CREATE OR REPLACE FUNCTION auto_sync_meeting_to_google()
RETURNS TRIGGER AS $$
DECLARE
  user_has_google_sync BOOLEAN := FALSE;
  google_refresh_token_exists BOOLEAN := FALSE;
  sync_enabled_pref BOOLEAN := TRUE;
  organizer_user_id UUID;
  meeting_org_id UUID;
BEGIN
  -- Get organizer and org from appropriate record
  IF TG_OP = 'DELETE' THEN
    organizer_user_id := OLD.organizer_id;
    meeting_org_id := OLD.organization_id;
  ELSE
    organizer_user_id := NEW.organizer_id;
    meeting_org_id := NEW.organization_id;
  END IF;

  -- Check if the organizer has Google Calendar sync enabled and preferences
  SELECT 
    u.google_calendar_sync_enabled,
    (u.google_refresh_token IS NOT NULL),
    COALESCE(gsp.sync_enabled, TRUE)
  INTO user_has_google_sync, google_refresh_token_exists, sync_enabled_pref
  FROM users u
  LEFT JOIN google_calendar_sync_preferences gsp ON gsp.user_id = u.id
  WHERE u.id = organizer_user_id;
  
  -- User has Google sync if they have all required conditions
  user_has_google_sync := (
    user_has_google_sync = TRUE AND 
    google_refresh_token_exists = TRUE AND
    sync_enabled_pref = TRUE
  );
  
  -- Only proceed if user has Google sync enabled
  IF user_has_google_sync = TRUE THEN
    BEGIN
      -- For INSERT (new meetings)
      IF TG_OP = 'INSERT' THEN
        -- Set sync status to pending for automatic sync
        NEW.sync_status = 'pending';
        
        -- Log the sync request with error handling
        INSERT INTO calendar_sync_log (
          user_id,
          organization_id, 
          meeting_request_id,
          sync_type,
          status,
          created_at,
          updated_at
        ) VALUES (
          organizer_user_id,
          meeting_org_id,
          NEW.id,
          'export_to_google',
          'pending',
          now(),
          now()
        );
        
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
            organizer_user_id,
            meeting_org_id,
            NEW.id,
            CASE WHEN NEW.status = 'cancelled' THEN 'delete_google' ELSE 'update_google' END,
            'pending',
            NEW.google_event_id,
            now(),
            now()
          );
        END IF;
        
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
            organizer_user_id,
            meeting_org_id,
            OLD.id,
            'delete_google',
            'pending', 
            OLD.google_event_id,
            now(),
            now()
          );
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the main transaction
      RAISE LOG 'Auto sync trigger failed for meeting %: %', 
        COALESCE(NEW.id, OLD.id), SQLERRM;
    END;
  END IF;
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW; 
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;