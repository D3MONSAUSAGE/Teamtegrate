-- Add assigned_at column to tasks table
ALTER TABLE public.tasks ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance on assigned_at queries
CREATE INDEX idx_tasks_assigned_at ON public.tasks(assigned_at);
CREATE INDEX idx_tasks_assigned_at_org ON public.tasks(assigned_at, organization_id);

-- Create function to update assigned_at when assignments change
CREATE OR REPLACE FUNCTION public.update_task_assigned_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if assignment fields have changed
  IF (OLD.assigned_to_id IS DISTINCT FROM NEW.assigned_to_id) OR
     (OLD.assigned_to_ids IS DISTINCT FROM NEW.assigned_to_ids) OR
     (OLD.assigned_to_names IS DISTINCT FROM NEW.assigned_to_names) THEN
    
    -- Only update assigned_at if there's actually an assignment (not clearing)
    IF NEW.assigned_to_id IS NOT NULL OR 
       (NEW.assigned_to_ids IS NOT NULL AND array_length(NEW.assigned_to_ids, 1) > 0) THEN
      NEW.assigned_at = now();
    ELSE
      -- Clear assigned_at if assignment is removed
      NEW.assigned_at = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update assigned_at
CREATE TRIGGER trigger_update_task_assigned_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_assigned_at();

-- Populate historical data: set assigned_at to created_at for existing assigned tasks
UPDATE public.tasks 
SET assigned_at = created_at 
WHERE (assigned_to_id IS NOT NULL OR 
       (assigned_to_ids IS NOT NULL AND array_length(assigned_to_ids, 1) > 0))
  AND assigned_at IS NULL;

-- Fix the RPC function to use assigned_at for "assigned" count
CREATE OR REPLACE FUNCTION public.rpc_task_report_user_day(
  p_user_id uuid,
  p_org_id uuid,
  p_date_iso text,
  p_timezone text DEFAULT 'UTC'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_date date;
  result jsonb;
  completed_count int := 0;
  assigned_count int := 0;
  overdue_count int := 0;
  in_progress_count int := 0;
  pending_count int := 0;
BEGIN
  -- Parse the date
  target_date := p_date_iso::date;
  
  -- Count completed tasks (completed today)
  SELECT COUNT(*) INTO completed_count
  FROM public.tasks
  WHERE organization_id = p_org_id
    AND (user_id = p_user_id::text OR 
         assigned_to_id = p_user_id::text OR 
         p_user_id::text = ANY(assigned_to_ids))
    AND status = 'Completed'
    AND DATE(completed_at AT TIME ZONE p_timezone) = target_date;
  
  -- Count assigned tasks (assigned today) - NOW USING assigned_at
  SELECT COUNT(*) INTO assigned_count
  FROM public.tasks
  WHERE organization_id = p_org_id
    AND (user_id = p_user_id::text OR 
         assigned_to_id = p_user_id::text OR 
         p_user_id::text = ANY(assigned_to_ids))
    AND assigned_at IS NOT NULL
    AND DATE(assigned_at AT TIME ZONE p_timezone) = target_date;
  
  -- Count overdue tasks (due before today, not completed)
  SELECT COUNT(*) INTO overdue_count
  FROM public.tasks
  WHERE organization_id = p_org_id
    AND (user_id = p_user_id::text OR 
         assigned_to_id = p_user_id::text OR 
         p_user_id::text = ANY(assigned_to_ids))
    AND status != 'Completed'
    AND DATE(deadline AT TIME ZONE p_timezone) < target_date;
  
  -- Count in progress tasks
  SELECT COUNT(*) INTO in_progress_count
  FROM public.tasks
  WHERE organization_id = p_org_id
    AND (user_id = p_user_id::text OR 
         assigned_to_id = p_user_id::text OR 
         p_user_id::text = ANY(assigned_to_ids))
    AND status = 'In Progress';
  
  -- Count pending tasks
  SELECT COUNT(*) INTO pending_count
  FROM public.tasks
  WHERE organization_id = p_org_id
    AND (user_id = p_user_id::text OR 
         assigned_to_id = p_user_id::text OR 
         p_user_id::text = ANY(assigned_to_ids))
    AND status = 'Pending';
  
  -- Build result
  result := jsonb_build_object(
    'completed', completed_count,
    'assigned', assigned_count,
    'overdue', overdue_count,
    'in_progress', in_progress_count,
    'pending', pending_count,
    'date', target_date,
    'user_id', p_user_id,
    'timezone', p_timezone
  );
  
  RETURN result;
END;
$$;