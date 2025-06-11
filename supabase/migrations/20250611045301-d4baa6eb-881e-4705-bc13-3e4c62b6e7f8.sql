
-- Add timezone column to users table to store user's timezone preference
ALTER TABLE public.users ADD COLUMN timezone TEXT DEFAULT 'UTC';

-- Update the send_reminders function to be timezone-aware
CREATE OR REPLACE FUNCTION public.send_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert reminders for tasks due tomorrow in each user's local timezone
  INSERT INTO public.notifications (user_id, title, content, type, task_id)
  SELECT 
    CASE 
      WHEN t.user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN t.user_id::uuid 
      ELSE NULL 
    END,
    'Task Reminder',
    'Reminder: Task "' || t.title || '" is due tomorrow',
    'reminder',
    t.id
  FROM public.tasks t
  LEFT JOIN public.users u ON t.user_id = u.id::text
  WHERE 
    -- Check if task deadline is tomorrow in user's timezone
    DATE(t.deadline AT TIME ZONE COALESCE(u.timezone, 'UTC')) = DATE((now() AT TIME ZONE COALESCE(u.timezone, 'UTC')) + interval '1 day')
    AND t.status != 'Completed'
    AND t.user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.task_id = t.id 
        AND DATE(n.created_at AT TIME ZONE COALESCE(u.timezone, 'UTC')) = DATE(now() AT TIME ZONE COALESCE(u.timezone, 'UTC'))
        AND n.type = 'reminder'
    );

  -- Insert reminders for events starting tomorrow in user's timezone
  INSERT INTO public.notifications (user_id, title, content, type, event_id)
  SELECT 
    e.user_id,
    'Event Reminder',
    'Reminder: Event "' || e.title || '" starts tomorrow',
    'reminder',
    e.id
  FROM public.events e
  LEFT JOIN public.users u ON e.user_id = u.id
  WHERE 
    -- Check if event start date is tomorrow in user's timezone
    DATE(e.start_date AT TIME ZONE COALESCE(u.timezone, 'UTC')) = DATE((now() AT TIME ZONE COALESCE(u.timezone, 'UTC')) + interval '1 day')
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.event_id = e.id 
        AND DATE(n.created_at AT TIME ZONE COALESCE(u.timezone, 'UTC')) = DATE(now() AT TIME ZONE COALESCE(u.timezone, 'UTC'))
        AND n.type = 'reminder'
    );
END;
$$;

-- Create a function to check if it's midnight in any user's timezone
CREATE OR REPLACE FUNCTION public.send_timezone_aware_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  user_local_time TIMESTAMP WITH TIME ZONE;
  user_local_hour INTEGER;
BEGIN
  -- Loop through users and check if it's midnight in their timezone
  FOR user_record IN 
    SELECT DISTINCT u.id, u.timezone, u.name, u.email
    FROM public.users u
    WHERE u.timezone IS NOT NULL
  LOOP
    -- Get current time in user's timezone
    user_local_time := now() AT TIME ZONE user_record.timezone;
    user_local_hour := EXTRACT(HOUR FROM user_local_time);
    
    -- If it's midnight in user's timezone (hour 0), send reminders
    IF user_local_hour = 0 THEN
      -- Send task reminders for this specific user
      INSERT INTO public.notifications (user_id, title, content, type, task_id)
      SELECT 
        user_record.id,
        'Task Reminder',
        'Reminder: Task "' || t.title || '" is due tomorrow',
        'reminder',
        t.id
      FROM public.tasks t
      WHERE 
        t.user_id = user_record.id::text
        AND DATE(t.deadline AT TIME ZONE user_record.timezone) = DATE((now() AT TIME ZONE user_record.timezone) + interval '1 day')
        AND t.status != 'Completed'
        AND NOT EXISTS (
          SELECT 1 FROM public.notifications n 
          WHERE n.task_id = t.id 
            AND DATE(n.created_at AT TIME ZONE user_record.timezone) = DATE(now() AT TIME ZONE user_record.timezone)
            AND n.type = 'reminder'
        );

      -- Send event reminders for this specific user
      INSERT INTO public.notifications (user_id, title, content, type, event_id)
      SELECT 
        user_record.id,
        'Event Reminder',
        'Reminder: Event "' || e.title || '" starts tomorrow',
        'reminder',
        e.id
      FROM public.events e
      WHERE 
        e.user_id = user_record.id
        AND DATE(e.start_date AT TIME ZONE user_record.timezone) = DATE((now() AT TIME ZONE user_record.timezone) + interval '1 day')
        AND NOT EXISTS (
          SELECT 1 FROM public.notifications n 
          WHERE n.event_id = e.id 
            AND DATE(n.created_at AT TIME ZONE user_record.timezone) = DATE(now() AT TIME ZONE user_record.timezone)
            AND n.type = 'reminder'
        );
    END IF;
  END LOOP;
END;
$$;
