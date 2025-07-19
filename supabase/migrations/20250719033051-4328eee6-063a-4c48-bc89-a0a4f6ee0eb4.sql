
-- Improved function to handle active time entry clock out more robustly
CREATE OR REPLACE FUNCTION public.update_time_entry_clock_out(
  p_user_id UUID,
  p_task_id TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_entry_id UUID;
  updated_task_id TEXT;
  result JSONB;
BEGIN
  -- If task_id is provided, try to find and close that specific task's active session
  IF p_task_id IS NOT NULL AND p_task_id != '' THEN
    UPDATE public.time_entries 
    SET clock_out = NOW()
    WHERE user_id = p_user_id 
      AND task_id = p_task_id 
      AND clock_out IS NULL
      AND id = (
        SELECT id 
        FROM public.time_entries 
        WHERE user_id = p_user_id 
          AND task_id = p_task_id 
          AND clock_out IS NULL 
        ORDER BY clock_in DESC 
        LIMIT 1
      )
    RETURNING id, task_id INTO updated_entry_id, updated_task_id;
  END IF;
  
  -- If no specific task was updated, close the most recent active session for the user
  IF updated_entry_id IS NULL THEN
    UPDATE public.time_entries 
    SET clock_out = NOW()
    WHERE user_id = p_user_id 
      AND clock_out IS NULL
      AND id = (
        SELECT id 
        FROM public.time_entries 
        WHERE user_id = p_user_id 
          AND clock_out IS NULL 
        ORDER BY clock_in DESC 
        LIMIT 1
      )
    RETURNING id, task_id INTO updated_entry_id, updated_task_id;
  END IF;
  
  -- Return result with information about what was updated
  IF updated_entry_id IS NOT NULL THEN
    result := jsonb_build_object(
      'success', true,
      'entry_id', updated_entry_id,
      'task_id', updated_task_id,
      'message', 'Time entry closed successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'message', 'No active time entry found for user'
    );
  END IF;
  
  RETURN result;
END;
$$;
