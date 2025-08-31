-- Add recurring task fields to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_pattern jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_parent_id text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS next_due_date timestamp with time zone;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_end_date timestamp with time zone;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_count integer DEFAULT 0;

-- Create index for recurring tasks queries
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON public.tasks(is_recurring, next_due_date) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_parent ON public.tasks(recurrence_parent_id) WHERE recurrence_parent_id IS NOT NULL;

-- Create function to generate next occurrence of recurring task
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
  
  -- Calculate next deadline based on recurrence pattern
  IF parent_task.recurrence_pattern->>'frequency' = 'daily' THEN
    next_deadline := parent_task.next_due_date + 
      (COALESCE((parent_task.recurrence_pattern->>'interval')::integer, 1) * INTERVAL '1 day');
  ELSIF parent_task.recurrence_pattern->>'frequency' = 'weekly' THEN
    next_deadline := parent_task.next_due_date + 
      (COALESCE((parent_task.recurrence_pattern->>'interval')::integer, 1) * INTERVAL '1 week');
  ELSIF parent_task.recurrence_pattern->>'frequency' = 'monthly' THEN
    next_deadline := parent_task.next_due_date + 
      (COALESCE((parent_task.recurrence_pattern->>'interval')::integer, 1) * INTERVAL '1 month');
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
    assigned_to_id, assigned_to_name, assigned_to_ids, assigned_to_names,
    user_id, organization_id, status, created_at, updated_at,
    is_recurring, recurrence_parent_id
  ) VALUES (
    new_task_id, parent_task.title, parent_task.description, parent_task.priority,
    next_deadline, parent_task.project_id, parent_task.cost,
    parent_task.assigned_to_id, parent_task.assigned_to_name, 
    parent_task.assigned_to_ids, parent_task.assigned_to_names,
    parent_task.user_id, parent_task.organization_id, 'Pending',
    now(), now(), false, parent_task_id
  );
  
  -- Update parent task's next due date and count
  UPDATE public.tasks 
  SET 
    next_due_date = next_deadline,
    recurrence_count = recurrence_count + 1,
    updated_at = now()
  WHERE id = parent_task_id;
  
  RETURN new_task_id;
END;
$$;