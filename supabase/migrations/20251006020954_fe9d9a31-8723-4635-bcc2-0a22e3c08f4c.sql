-- Drop and recreate auto_close_stale_sessions with timezone awareness
DROP FUNCTION IF EXISTS public.auto_close_stale_sessions();

CREATE OR REPLACE FUNCTION public.auto_close_stale_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  cutoff_time TIMESTAMP WITH TIME ZONE;
  session_record RECORD;
  user_timezone TEXT;
  end_of_day_utc TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Close sessions older than 24 hours or that started yesterday in user's timezone
  cutoff_time := NOW() - INTERVAL '24 hours';
  
  FOR session_record IN 
    SELECT te.id, te.user_id, te.clock_in, te.notes, u.timezone
    FROM public.time_entries te
    JOIN public.users u ON te.user_id = u.id
    WHERE te.clock_out IS NULL 
    AND (te.clock_in < cutoff_time OR DATE(te.clock_in AT TIME ZONE COALESCE(u.timezone, 'UTC')) < DATE(NOW() AT TIME ZONE COALESCE(u.timezone, 'UTC')))
  LOOP
    user_timezone := COALESCE(session_record.timezone, 'UTC');
    
    -- Calculate end of day in user's timezone, then convert to UTC
    end_of_day_utc := (DATE_TRUNC('day', session_record.clock_in AT TIME ZONE user_timezone) 
                       + INTERVAL '1 day' - INTERVAL '1 minute') AT TIME ZONE user_timezone;
    
    -- Auto-close with note including timezone info
    UPDATE public.time_entries 
    SET 
      clock_out = LEAST(
        session_record.clock_in + INTERVAL '16 hours', -- Max 16 hour session
        end_of_day_utc -- End of day in user's timezone
      ),
      notes = COALESCE(session_record.notes, '') || 
              ' [Auto-closed: Session exceeded limits. Closed at ' || 
              TO_CHAR(LEAST(session_record.clock_in + INTERVAL '16 hours', end_of_day_utc) AT TIME ZONE user_timezone, 'YYYY-MM-DD HH24:MI:SS TZ') || 
              ' (' || user_timezone || ')]'
    WHERE id = session_record.id;
  END LOOP;
END;
$function$;

-- Drop and recreate end_of_day_auto_close with timezone awareness
DROP FUNCTION IF EXISTS public.end_of_day_auto_close();

CREATE OR REPLACE FUNCTION public.end_of_day_auto_close()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  session_record RECORD;
  user_timezone TEXT;
  end_of_day_utc TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Close all active sessions at end of business day in user's timezone
  FOR session_record IN 
    SELECT te.id, te.user_id, te.clock_in, te.notes, u.timezone
    FROM public.time_entries te
    JOIN public.users u ON te.user_id = u.id
    WHERE te.clock_out IS NULL 
    AND DATE(te.clock_in AT TIME ZONE COALESCE(u.timezone, 'UTC')) < DATE(NOW() AT TIME ZONE COALESCE(u.timezone, 'UTC'))
  LOOP
    user_timezone := COALESCE(session_record.timezone, 'UTC');
    
    -- Calculate end of day (23:59:59) in user's timezone, convert to UTC
    end_of_day_utc := (DATE_TRUNC('day', session_record.clock_in AT TIME ZONE user_timezone) 
                       + INTERVAL '23 hours 59 minutes') AT TIME ZONE user_timezone;
    
    UPDATE public.time_entries 
    SET 
      clock_out = end_of_day_utc,
      notes = COALESCE(session_record.notes, '') || 
              ' [Auto-closed: End of business day at ' || 
              TO_CHAR(end_of_day_utc AT TIME ZONE user_timezone, 'YYYY-MM-DD HH24:MI TZ') || 
              ' (' || user_timezone || ')]'
    WHERE id = session_record.id;
  END LOOP;
END;
$function$;