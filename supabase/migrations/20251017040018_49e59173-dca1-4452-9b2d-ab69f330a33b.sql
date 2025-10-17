-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fix the generate_recurring_task_occurrence function to properly handle weekly daysOfWeek
CREATE OR REPLACE FUNCTION public.generate_recurring_task_occurrence(
  parent_task_id text,
  organization_id_param uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  parent_task RECORD;
  new_task_id uuid;
  next_deadline timestamp with time zone;
  current_day_of_week integer;
  target_days integer[];
  next_valid_day integer;
  days_to_add integer;
  interval_val integer;
BEGIN
  -- Get parent task details
  SELECT * INTO parent_task 
  FROM public.tasks 
  WHERE id = parent_task_id 
    AND organization_id = organization_id_param
    AND is_recurring = true;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent recurring task not found';
  END IF;
  
  -- Get interval (default to 1)
  interval_val := COALESCE((parent_task.recurrence_pattern->>'interval')::integer, 1);
  
  -- Calculate next deadline based on recurrence pattern
  IF parent_task.recurrence_pattern->>'frequency' = 'daily' THEN
    next_deadline := COALESCE(parent_task.next_due_date, parent_task.deadline) + 
      (interval_val * INTERVAL '1 day');
      
  ELSIF parent_task.recurrence_pattern->>'frequency' = 'weekly' THEN
    -- Extract target days of week from recurrence pattern
    -- daysOfWeek is an array where 0=Sunday, 1=Monday, ..., 6=Saturday
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(parent_task.recurrence_pattern->'daysOfWeek')::integer
    ) INTO target_days;
    
    -- Get current day of week from next_due_date (0=Sunday, 6=Saturday)
    current_day_of_week := EXTRACT(DOW FROM COALESCE(parent_task.next_due_date, parent_task.deadline))::integer;
    
    -- Find next occurrence day
    -- First, try to find next day in same week
    SELECT MIN(day) INTO next_valid_day
    FROM unnest(target_days) AS day
    WHERE day > current_day_of_week;
    
    IF next_valid_day IS NULL THEN
      -- No more days this week, wrap to next week (or interval weeks)
      SELECT MIN(day) INTO next_valid_day
      FROM unnest(target_days) AS day;
      
      -- Calculate days to add (wrap to next week/interval)
      days_to_add := (7 - current_day_of_week) + next_valid_day + ((interval_val - 1) * 7);
    ELSE
      -- Found a day in the same week
      days_to_add := next_valid_day - current_day_of_week;
    END IF;
    
    next_deadline := COALESCE(parent_task.next_due_date, parent_task.deadline) + 
      (days_to_add * INTERVAL '1 day');
      
  ELSIF parent_task.recurrence_pattern->>'frequency' = 'monthly' THEN
    next_deadline := COALESCE(parent_task.next_due_date, parent_task.deadline) + 
      (interval_val * INTERVAL '1 month');
  ELSE
    RAISE EXCEPTION 'Unsupported recurrence frequency';
  END IF;
  
  -- Check if we should stop recurring (end date or count limit)
  IF parent_task.recurrence_end_date IS NOT NULL AND next_deadline > parent_task.recurrence_end_date THEN
    RETURN NULL; -- Stop recurring
  END IF;
  
  -- Generate new task ID
  new_task_id := gen_random_uuid();
  
  -- Create new occurrence
  INSERT INTO public.tasks (
    id, title, description, priority, deadline, project_id, cost,
    assigned_to_id, assigned_to_ids, assigned_to_names,
    user_id, organization_id, status, created_at, updated_at,
    is_recurring, recurrence_parent_id, warning_period_hours
  ) VALUES (
    new_task_id, parent_task.title, parent_task.description, parent_task.priority,
    next_deadline, parent_task.project_id, parent_task.cost,
    parent_task.assigned_to_id, parent_task.assigned_to_ids, parent_task.assigned_to_names,
    parent_task.user_id, parent_task.organization_id, 'To Do',
    now(), now(), false, parent_task_id, parent_task.warning_period_hours
  );
  
  -- Update parent task's next due date and count
  UPDATE public.tasks 
  SET 
    next_due_date = next_deadline,
    recurrence_count = COALESCE(recurrence_count, 0) + 1,
    updated_at = now()
  WHERE id = parent_task_id;
  
  RETURN new_task_id;
END;
$$;

-- Schedule the recurring tasks generation to run daily at 3am
SELECT cron.schedule(
  'generate-recurring-tasks-daily',
  '0 3 * * *', -- Every day at 3am
  $$
  SELECT net.http_post(
    url:='https://zlfpiovyodiyecdueiig.supabase.co/functions/v1/generate-recurring-tasks',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZnBpb3Z5b2RpeWVjZHVlaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NzA0OTEsImV4cCI6MjA2MDM0NjQ5MX0.GAY6GgcApuuuH9MBXaThy-nW4UciDq2t6iSo6mMGiF4"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);