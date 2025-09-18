-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to process calendar sync queue every 5 minutes
SELECT cron.schedule(
  'process-calendar-sync-queue',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://zlfpiovyodiyecdueiig.supabase.co/functions/v1/process-calendar-sync-queue',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZnBpb3Z5b2RpeWVjZHVlaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NzA0OTEsImV4cCI6MjA2MDM0NjQ5MX0.GAY6GgcApuuuH9MBXaThy-nW4UciDq2t6iSo6mMGiF4"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create the missing manual sync RPC function
CREATE OR REPLACE FUNCTION public.manual_sync_meeting_to_google(meeting_id uuid, force_sync boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  meeting_record RECORD;
  user_record RECORD;
  sync_log_id uuid;
  result jsonb;
BEGIN
  -- Get meeting details with organizer info
  SELECT mr.*, u.google_calendar_sync_enabled, u.google_calendar_token, u.google_refresh_token
  INTO meeting_record
  FROM public.meeting_requests mr
  JOIN public.users u ON mr.organizer_id = u.id
  WHERE mr.id = meeting_id
    AND mr.organization_id = public.get_current_user_organization_id();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Meeting not found or access denied'
    );
  END IF;
  
  -- Check if user has Google Calendar enabled
  IF NOT meeting_record.google_calendar_sync_enabled THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Google Calendar sync is not enabled for the organizer'
    );
  END IF;
  
  -- Check if user has valid tokens
  IF meeting_record.google_calendar_token IS NULL OR meeting_record.google_refresh_token IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Google Calendar authentication required'
    );
  END IF;
  
  -- Determine sync type based on current state
  DECLARE
    sync_type text;
  BEGIN
    IF meeting_record.google_event_id IS NULL THEN
      sync_type := 'create_google';
    ELSIF meeting_record.status = 'cancelled' THEN
      sync_type := 'delete_google';
    ELSE
      sync_type := 'update_google';
    END IF;
    
    -- Only proceed if force_sync is true or if the meeting needs sync
    IF NOT force_sync AND meeting_record.sync_status = 'synced' AND sync_type != 'delete_google' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Meeting is already synced. Use force_sync=true to override.'
      );
    END IF;
    
    -- Create sync log entry
    INSERT INTO public.calendar_sync_log (
      user_id, 
      organization_id, 
      meeting_request_id, 
      sync_type, 
      google_event_id, 
      status
    ) VALUES (
      meeting_record.organizer_id,
      meeting_record.organization_id,
      meeting_id,
      sync_type,
      meeting_record.google_event_id,
      'pending'
    ) RETURNING id INTO sync_log_id;
    
    -- Update meeting sync status to pending
    UPDATE public.meeting_requests 
    SET sync_status = 'pending'
    WHERE id = meeting_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Manual sync initiated',
      'sync_log_id', sync_log_id,
      'sync_type', sync_type
    );
  END;
END;
$function$;

-- Create function to retry failed sync operations
CREATE OR REPLACE FUNCTION public.retry_failed_sync_operations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  failed_count integer;
BEGIN
  -- Reset failed sync operations to pending for retry (only recent failures within 24 hours)
  UPDATE public.calendar_sync_log 
  SET status = 'pending', 
      error_message = NULL,
      updated_at = now()
  WHERE status = 'failed' 
    AND created_at > now() - interval '24 hours';
  
  GET DIAGNOSTICS failed_count = ROW_COUNT;
  
  -- Also update meeting sync status to pending for meetings that had failed syncs
  UPDATE public.meeting_requests 
  SET sync_status = 'pending'
  WHERE id IN (
    SELECT DISTINCT meeting_request_id 
    FROM public.calendar_sync_log 
    WHERE status = 'pending' 
      AND meeting_request_id IS NOT NULL
      AND updated_at = now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Failed sync operations reset for retry',
    'failed_operations_reset', failed_count
  );
END;
$function$;

-- Fix meeting sync status trigger to be more reliable
DROP TRIGGER IF EXISTS update_meeting_sync_status ON public.meeting_requests;

CREATE OR REPLACE FUNCTION public.trigger_meeting_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  organizer_sync_enabled boolean;
BEGIN
  -- Only trigger sync for non-cancelled meetings with sync-enabled organizers
  IF NEW.status != 'cancelled' THEN
    SELECT google_calendar_sync_enabled INTO organizer_sync_enabled
    FROM public.users 
    WHERE id = NEW.organizer_id;
    
    IF organizer_sync_enabled THEN
      -- Set sync status based on whether this is a new meeting or update
      IF TG_OP = 'INSERT' THEN
        NEW.sync_status := 'pending';
        
        -- Create sync log for new meeting
        INSERT INTO public.calendar_sync_log (
          user_id, 
          organization_id, 
          meeting_request_id, 
          sync_type, 
          status
        ) VALUES (
          NEW.organizer_id,
          NEW.organization_id,
          NEW.id,
          'create_google',
          'pending'
        );
      ELSIF TG_OP = 'UPDATE' AND (
        OLD.title IS DISTINCT FROM NEW.title OR
        OLD.description IS DISTINCT FROM NEW.description OR
        OLD.start_time IS DISTINCT FROM NEW.start_time OR
        OLD.end_time IS DISTINCT FROM NEW.end_time OR
        OLD.location IS DISTINCT FROM NEW.location
      ) THEN
        NEW.sync_status := 'pending';
        
        -- Create sync log for updated meeting
        INSERT INTO public.calendar_sync_log (
          user_id, 
          organization_id, 
          meeting_request_id, 
          sync_type, 
          google_event_id,
          status
        ) VALUES (
          NEW.organizer_id,
          NEW.organization_id,
          NEW.id,
          'update_google',
          NEW.google_event_id,
          'pending'
        );
      END IF;
    END IF;
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.google_event_id IS NOT NULL THEN
    -- Handle cancellation
    NEW.sync_status := 'pending';
    
    INSERT INTO public.calendar_sync_log (
      user_id, 
      organization_id, 
      meeting_request_id, 
      sync_type, 
      google_event_id,
      status
    ) VALUES (
      NEW.organizer_id,
      NEW.organization_id,
      NEW.id,
      'delete_google',
      NEW.google_event_id,
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER update_meeting_sync_status
  BEFORE INSERT OR UPDATE ON public.meeting_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_meeting_sync();