-- Add missing columns to time_entries table
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_paused_duration INTERVAL DEFAULT '0 seconds';

-- Create pause_time_entry function
CREATE OR REPLACE FUNCTION public.pause_time_entry(
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
  -- Find and pause the active time entry
  IF p_task_id IS NOT NULL AND p_task_id != '' THEN
    UPDATE public.time_entries 
    SET paused_at = NOW(),
        is_paused = true
    WHERE user_id = p_user_id 
      AND task_id = p_task_id 
      AND clock_out IS NULL
      AND is_paused = false
      AND id = (
        SELECT id 
        FROM public.time_entries 
        WHERE user_id = p_user_id 
          AND task_id = p_task_id 
          AND clock_out IS NULL
          AND is_paused = false
        ORDER BY clock_in DESC 
        LIMIT 1
      )
    RETURNING id, task_id INTO updated_entry_id, updated_task_id;
  ELSE
    UPDATE public.time_entries 
    SET paused_at = NOW(),
        is_paused = true
    WHERE user_id = p_user_id 
      AND clock_out IS NULL
      AND is_paused = false
      AND id = (
        SELECT id 
        FROM public.time_entries 
        WHERE user_id = p_user_id 
          AND clock_out IS NULL
          AND is_paused = false
        ORDER BY clock_in DESC 
        LIMIT 1
      )
    RETURNING id, task_id INTO updated_entry_id, updated_task_id;
  END IF;
  
  IF updated_entry_id IS NOT NULL THEN
    result := jsonb_build_object(
      'success', true,
      'entry_id', updated_entry_id,
      'task_id', updated_task_id,
      'message', 'Time entry paused successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'message', 'No active time entry found to pause'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Create resume_time_entry function
CREATE OR REPLACE FUNCTION public.resume_time_entry(
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
  pause_duration INTERVAL;
  result JSONB;
BEGIN
  -- Find and resume the paused time entry
  IF p_task_id IS NOT NULL AND p_task_id != '' THEN
    UPDATE public.time_entries 
    SET total_paused_duration = total_paused_duration + (NOW() - paused_at),
        paused_at = NULL,
        is_paused = false
    WHERE user_id = p_user_id 
      AND task_id = p_task_id 
      AND clock_out IS NULL
      AND is_paused = true
      AND id = (
        SELECT id 
        FROM public.time_entries 
        WHERE user_id = p_user_id 
          AND task_id = p_task_id 
          AND clock_out IS NULL
          AND is_paused = true
        ORDER BY clock_in DESC 
        LIMIT 1
      )
    RETURNING id, task_id INTO updated_entry_id, updated_task_id;
  ELSE
    UPDATE public.time_entries 
    SET total_paused_duration = total_paused_duration + (NOW() - paused_at),
        paused_at = NULL,
        is_paused = false
    WHERE user_id = p_user_id 
      AND clock_out IS NULL
      AND is_paused = true
      AND id = (
        SELECT id 
        FROM public.time_entries 
        WHERE user_id = p_user_id 
          AND clock_out IS NULL
          AND is_paused = true
        ORDER BY clock_in DESC 
        LIMIT 1
      )
    RETURNING id, task_id INTO updated_entry_id, updated_task_id;
  END IF;
  
  IF updated_entry_id IS NOT NULL THEN
    result := jsonb_build_object(
      'success', true,
      'entry_id', updated_entry_id,
      'task_id', updated_task_id,
      'message', 'Time entry resumed successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'message', 'No paused time entry found to resume'
    );
  END IF;
  
  RETURN result;
END;
$$;