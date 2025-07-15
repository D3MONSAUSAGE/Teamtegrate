
-- Add email preferences to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS daily_email_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_email_time TIME DEFAULT '08:00:00';

-- Create function to get daily task summary for a user
CREATE OR REPLACE FUNCTION public.get_daily_task_summary(target_user_id uuid, target_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_timezone TEXT;
  today_tasks jsonb;
  tomorrow_tasks jsonb;
  overdue_tasks jsonb;
  result jsonb;
BEGIN
  -- Get user's timezone
  SELECT timezone INTO user_timezone
  FROM public.users
  WHERE id = target_user_id;
  
  -- Default to UTC if no timezone set
  IF user_timezone IS NULL THEN
    user_timezone := 'UTC';
  END IF;
  
  -- Get tasks due today in user's timezone
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'title', t.title,
      'description', t.description,
      'priority', t.priority,
      'status', t.status,
      'deadline', t.deadline,
      'project_title', COALESCE(p.title, 'No Project')
    )
  ) INTO today_tasks
  FROM public.tasks t
  LEFT JOIN public.projects p ON t.project_id = p.id
  WHERE (
    t.user_id = target_user_id::text OR 
    t.assigned_to_id = target_user_id::text OR 
    target_user_id::text = ANY(t.assigned_to_ids)
  )
  AND t.organization_id = (SELECT organization_id FROM public.users WHERE id = target_user_id)
  AND DATE(t.deadline AT TIME ZONE user_timezone) = target_date
  AND t.status != 'Completed';
  
  -- Get tasks due tomorrow in user's timezone
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'title', t.title,
      'description', t.description,
      'priority', t.priority,
      'status', t.status,
      'deadline', t.deadline,
      'project_title', COALESCE(p.title, 'No Project')
    )
  ) INTO tomorrow_tasks
  FROM public.tasks t
  LEFT JOIN public.projects p ON t.project_id = p.id
  WHERE (
    t.user_id = target_user_id::text OR 
    t.assigned_to_id = target_user_id::text OR 
    target_user_id::text = ANY(t.assigned_to_ids)
  )
  AND t.organization_id = (SELECT organization_id FROM public.users WHERE id = target_user_id)
  AND DATE(t.deadline AT TIME ZONE user_timezone) = target_date + INTERVAL '1 day'
  AND t.status != 'Completed';
  
  -- Get overdue tasks in user's timezone
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'title', t.title,
      'description', t.description,
      'priority', t.priority,
      'status', t.status,
      'deadline', t.deadline,
      'project_title', COALESCE(p.title, 'No Project')
    )
  ) INTO overdue_tasks
  FROM public.tasks t
  LEFT JOIN public.projects p ON t.project_id = p.id
  WHERE (
    t.user_id = target_user_id::text OR 
    t.assigned_to_id = target_user_id::text OR 
    target_user_id::text = ANY(t.assigned_to_ids)
  )
  AND t.organization_id = (SELECT organization_id FROM public.users WHERE id = target_user_id)
  AND DATE(t.deadline AT TIME ZONE user_timezone) < target_date
  AND t.status != 'Completed';
  
  -- Build result
  result := jsonb_build_object(
    'user_id', target_user_id,
    'date', target_date,
    'timezone', user_timezone,
    'today_tasks', COALESCE(today_tasks, '[]'::jsonb),
    'tomorrow_tasks', COALESCE(tomorrow_tasks, '[]'::jsonb),
    'overdue_tasks', COALESCE(overdue_tasks, '[]'::jsonb),
    'today_count', COALESCE(jsonb_array_length(today_tasks), 0),
    'tomorrow_count', COALESCE(jsonb_array_length(tomorrow_tasks), 0),
    'overdue_count', COALESCE(jsonb_array_length(overdue_tasks), 0)
  );
  
  RETURN result;
END;
$$;

-- Enhanced timezone-aware daily email function
CREATE OR REPLACE FUNCTION public.send_daily_emails_and_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  user_local_time TIMESTAMP WITH TIME ZONE;
  user_local_hour INTEGER;
  user_local_minute INTEGER;
  email_hour INTEGER;
  email_minute INTEGER;
BEGIN
  -- Loop through users and check if it's their email time
  FOR user_record IN 
    SELECT DISTINCT u.id, u.timezone, u.name, u.email, u.daily_email_enabled, u.daily_email_time
    FROM public.users u
    WHERE u.timezone IS NOT NULL 
    AND u.daily_email_enabled = true
    AND u.daily_email_time IS NOT NULL
  LOOP
    -- Get current time in user's timezone
    user_local_time := now() AT TIME ZONE user_record.timezone;
    user_local_hour := EXTRACT(HOUR FROM user_local_time);
    user_local_minute := EXTRACT(MINUTE FROM user_local_time);
    
    -- Get user's preferred email time
    email_hour := EXTRACT(HOUR FROM user_record.daily_email_time);
    email_minute := EXTRACT(MINUTE FROM user_record.daily_email_time);
    
    -- Check if it's the user's preferred email time (within 1 hour window)
    IF user_local_hour = email_hour AND user_local_minute >= email_minute AND user_local_minute < (email_minute + 60) THEN
      -- Create a notification to trigger the email function
      INSERT INTO public.notifications (user_id, title, content, type, organization_id)
      SELECT 
        user_record.id,
        'Daily Task Summary',
        'Your daily task summary email is being prepared',
        'daily_email',
        organization_id
      FROM public.users 
      WHERE id = user_record.id
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n 
        WHERE n.user_id = user_record.id 
          AND DATE(n.created_at AT TIME ZONE user_record.timezone) = DATE(now() AT TIME ZONE user_record.timezone)
          AND n.type = 'daily_email'
      );
    END IF;
    
    -- Also send regular reminders at midnight (existing functionality)
    IF user_local_hour = 0 THEN
      -- Send task reminders for this specific user
      INSERT INTO public.notifications (user_id, title, content, type, task_id, organization_id)
      SELECT 
        user_record.id,
        'Task Reminder',
        'Reminder: Task "' || t.title || '" is due tomorrow',
        'reminder',
        t.id,
        t.organization_id
      FROM public.tasks t
      WHERE 
        (t.user_id = user_record.id::text OR 
         t.assigned_to_id = user_record.id::text OR 
         user_record.id::text = ANY(t.assigned_to_ids))
        AND DATE(t.deadline AT TIME ZONE user_record.timezone) = DATE((now() AT TIME ZONE user_record.timezone) + interval '1 day')
        AND t.status != 'Completed'
        AND NOT EXISTS (
          SELECT 1 FROM public.notifications n 
          WHERE n.task_id = t.id 
            AND DATE(n.created_at AT TIME ZONE user_record.timezone) = DATE(now() AT TIME ZONE user_record.timezone)
            AND n.type = 'reminder'
        );

      -- Send event reminders for this specific user
      INSERT INTO public.notifications (user_id, title, content, type, event_id, organization_id)
      SELECT 
        user_record.id,
        'Event Reminder',
        'Reminder: Event "' || e.title || '" starts tomorrow',
        'reminder',
        e.id,
        e.organization_id
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
