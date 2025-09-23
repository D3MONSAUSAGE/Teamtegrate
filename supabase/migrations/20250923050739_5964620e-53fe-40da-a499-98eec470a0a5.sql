-- Fix meeting creation by removing immediate calendar_sync_log creation from trigger
CREATE OR REPLACE FUNCTION public.trigger_meeting_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set sync_status, don't create calendar_sync_log entries immediately
  -- Let cron jobs or manual sync functions handle actual log creation
  IF TG_OP = 'INSERT' THEN
    NEW.sync_status = 'pending';
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If meeting details changed, mark for re-sync
    IF OLD.title IS DISTINCT FROM NEW.title OR 
       OLD.description IS DISTINCT FROM NEW.description OR
       OLD.start_time IS DISTINCT FROM NEW.start_time OR
       OLD.end_time IS DISTINCT FROM NEW.end_time OR
       OLD.location IS DISTINCT FROM NEW.location THEN
      NEW.sync_status = 'pending';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- For deletes, we can't modify the record, so return OLD as-is
    RETURN OLD;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;