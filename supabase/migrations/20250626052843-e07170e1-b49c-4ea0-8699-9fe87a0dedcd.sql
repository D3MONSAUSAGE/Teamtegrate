
-- Modify the time validation trigger to be more forgiving of small time differences
CREATE OR REPLACE FUNCTION public.validate_time_entry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  session_duration INTERVAL;
  max_duration INTERVAL := '16 hours';
  time_buffer INTERVAL := '30 seconds'; -- Allow 30 second buffer for clock sync
BEGIN
  -- Only validate on INSERT or UPDATE with clock_out
  IF NEW.clock_out IS NOT NULL THEN
    session_duration := NEW.clock_out - NEW.clock_in;
    
    -- Prevent sessions longer than 16 hours
    IF session_duration > max_duration THEN
      NEW.clock_out := NEW.clock_in + max_duration;
      NEW.notes := COALESCE(NEW.notes, '') || ' [Adjusted: Exceeded maximum session duration]';
    END IF;
    
    -- Prevent negative durations
    IF session_duration < INTERVAL '0 minutes' THEN
      RAISE EXCEPTION 'Clock out time cannot be before clock in time';
    END IF;
    
    -- Prevent future clock times with buffer for sync issues
    IF NEW.clock_in > (NOW() + time_buffer) OR NEW.clock_out > (NOW() + time_buffer) THEN
      RAISE EXCEPTION 'Clock times cannot be in the future (Server time: %, Your clock out: %)', 
        NOW(), NEW.clock_out;
    END IF;
  END IF;
  
  -- Prevent clock-in in the future with buffer
  IF NEW.clock_in > (NOW() + time_buffer) THEN
    RAISE EXCEPTION 'Clock in time cannot be in the future (Server time: %, Your clock in: %)', 
      NOW(), NEW.clock_in;
  END IF;
  
  RETURN NEW;
END;
$$;
