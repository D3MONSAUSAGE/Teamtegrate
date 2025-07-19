-- Create function to update time entry clock out with server-side timestamp
CREATE OR REPLACE FUNCTION public.update_time_entry_clock_out(
  p_user_id UUID,
  p_task_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the most recent active time entry for this user and task
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
    );
    
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active time entry found for user % and task %', p_user_id, p_task_id;
  END IF;
END;
$$;