-- Create a function to automatically process calendar sync queue
CREATE OR REPLACE FUNCTION public.process_calendar_sync_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Call the edge function to process the calendar sync queue
  PERFORM
    net.http_post(
      url := 'https://zlfpiovyodiyecdueiig.supabase.co/functions/v1/process-calendar-sync-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZnBpb3Z5b2RpeWVjZHVlaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NzA0OTEsImV4cCI6MjA2MDM0NjQ5MX0.GAY6GgcApuuuH9MBXaThy-nW4UciDq2t6iSo6mMGiF4'
      ),
      body := jsonb_build_object('trigger', 'auto')
    );
    
  RAISE LOG 'Calendar sync queue processing triggered';
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Failed to trigger calendar sync queue processing: %', SQLERRM;
END;
$function$;

-- Create a trigger function that automatically processes sync queue when new entries are added
CREATE OR REPLACE FUNCTION public.auto_process_sync_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only trigger for pending sync operations
  IF NEW.status = 'pending' THEN
    -- Schedule background processing (non-blocking)
    PERFORM public.process_calendar_sync_queue();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger on calendar_sync_log table
DROP TRIGGER IF EXISTS trigger_auto_process_sync_queue ON public.calendar_sync_log;
CREATE TRIGGER trigger_auto_process_sync_queue
  AFTER INSERT ON public.calendar_sync_log
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_process_sync_queue();

-- Create a manual sync function that can be called directly
CREATE OR REPLACE FUNCTION public.manual_sync_meeting_to_google(meeting_id_param uuid, action_param text DEFAULT 'create')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result jsonb;
  meeting_record record;
  user_org_id uuid;
BEGIN
  -- Get current user's organization
  SELECT organization_id INTO user_org_id 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Verify user has access to this meeting
  SELECT * INTO meeting_record 
  FROM public.meeting_requests 
  WHERE id = meeting_id_param 
    AND organization_id = user_org_id
    AND (organizer_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM public.meeting_participants WHERE meeting_request_id = meeting_id_param
    ));
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Meeting not found or access denied'
    );
  END IF;
  
  -- Create a sync log entry
  INSERT INTO public.calendar_sync_log (
    user_id, 
    organization_id,
    meeting_request_id,
    sync_type,
    status
  ) VALUES (
    auth.uid(),
    user_org_id,
    meeting_id_param,
    CASE 
      WHEN action_param = 'delete' THEN 'delete_google'
      WHEN action_param = 'update' THEN 'update_google'  
      ELSE 'export_to_google'
    END,
    'pending'
  );
  
  -- The trigger will automatically process this sync entry
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Sync initiated successfully'
  );
END;
$function$;