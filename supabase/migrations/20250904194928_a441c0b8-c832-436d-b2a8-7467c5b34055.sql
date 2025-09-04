-- Fix the security issue by setting the search_path for the notification function
CREATE OR REPLACE FUNCTION public.notify_organizer_of_meeting_response()
RETURNS TRIGGER AS $$
DECLARE
  meeting_record RECORD;
  organizer_record RECORD;
  participant_record RECORD;
  meeting_date_formatted TEXT;
  meeting_time_formatted TEXT;
BEGIN
  -- Only trigger on status changes to accepted, declined, or tentative
  IF NEW.response_status IN ('accepted', 'declined', 'tentative') AND 
     (OLD.response_status IS DISTINCT FROM NEW.response_status) THEN
    
    -- Get meeting details
    SELECT * INTO meeting_record
    FROM public.meeting_requests
    WHERE id = NEW.meeting_request_id;
    
    -- Get organizer details
    SELECT * INTO organizer_record
    FROM public.users
    WHERE id = meeting_record.organizer_id;
    
    -- Get participant details
    SELECT * INTO participant_record
    FROM public.users
    WHERE id = NEW.user_id;
    
    -- Format date and time
    meeting_date_formatted := to_char(meeting_record.start_time, 'Mon DD, YYYY');
    meeting_time_formatted := to_char(meeting_record.start_time, 'HH12:MI AM') || ' - ' || 
                             to_char(meeting_record.end_time, 'HH12:MI AM');
    
    -- Insert notification record for in-app notifications
    INSERT INTO public.notifications (
      user_id,
      title,
      content,
      type,
      organization_id,
      created_at
    ) VALUES (
      meeting_record.organizer_id,
      'Meeting Response: ' || CASE 
        WHEN NEW.response_status = 'accepted' THEN 'Accepted'
        WHEN NEW.response_status = 'declined' THEN 'Declined'
        ELSE 'Tentative'
      END,
      COALESCE(participant_record.name, participant_record.email, 'Someone') || ' ' || 
      NEW.response_status || ' the invitation for "' || meeting_record.title || '"',
      'meeting_response_' || NEW.response_status,
      meeting_record.organization_id,
      NOW()
    );
    
    -- Call edge function to send email notification
    -- Only if organizer has a valid email and is different from the participant
    IF organizer_record.email IS NOT NULL AND 
       organizer_record.id != NEW.user_id THEN
      
      PERFORM net.http_post(
        url := 'https://zlfpiovyodiyecdueiig.functions.supabase.co/functions/v1/send-meeting-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.jwt_token', true)
        ),
        body := jsonb_build_object(
          'organizerEmail', organizer_record.email,
          'organizerName', COALESCE(organizer_record.name, organizer_record.email),
          'participantName', COALESCE(participant_record.name, participant_record.email, 'Someone'),
          'meetingTitle', meeting_record.title,
          'meetingDate', meeting_date_formatted,
          'meetingTime', meeting_time_formatted,
          'responseType', NEW.response_status,
          'location', meeting_record.location
        )
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;