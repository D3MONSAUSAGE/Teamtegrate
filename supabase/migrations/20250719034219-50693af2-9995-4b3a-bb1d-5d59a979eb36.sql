
-- Add pause-related fields to time_entries table
ALTER TABLE public.time_entries 
ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN total_paused_duration INTERVAL DEFAULT '0 seconds',
ADD COLUMN is_paused BOOLEAN DEFAULT false;

-- Create function to pause a time entry
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

-- Create function to resume a time entry
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

-- Update the clock out function to handle paused entries
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
  entry_record RECORD;
  result JSONB;
BEGIN
  -- If task_id is provided, try to find and close that specific task's active session
  IF p_task_id IS NOT NULL AND p_task_id != '' THEN
    -- First get the entry details
    SELECT id, task_id, is_paused, paused_at, total_paused_duration
    INTO entry_record
    FROM public.time_entries 
    WHERE user_id = p_user_id 
      AND task_id = p_task_id 
      AND clock_out IS NULL
    ORDER BY clock_in DESC 
    LIMIT 1;
    
    IF entry_record.id IS NOT NULL THEN
      -- If paused, add final pause duration before closing
      IF entry_record.is_paused AND entry_record.paused_at IS NOT NULL THEN
        UPDATE public.time_entries 
        SET clock_out = NOW(),
            total_paused_duration = total_paused_duration + (NOW() - paused_at),
            is_paused = false,
            paused_at = NULL
        WHERE id = entry_record.id
        RETURNING id, task_id INTO updated_entry_id, updated_task_id;
      ELSE
        UPDATE public.time_entries 
        SET clock_out = NOW()
        WHERE id = entry_record.id
        RETURNING id, task_id INTO updated_entry_id, updated_task_id;
      END IF;
    END IF;
  END IF;
  
  -- If no specific task was updated, close the most recent active session for the user
  IF updated_entry_id IS NULL THEN
    -- First get the entry details
    SELECT id, task_id, is_paused, paused_at, total_paused_duration
    INTO entry_record
    FROM public.time_entries 
    WHERE user_id = p_user_id 
      AND clock_out IS NULL
    ORDER BY clock_in DESC 
    LIMIT 1;
    
    IF entry_record.id IS NOT NULL THEN
      -- If paused, add final pause duration before closing
      IF entry_record.is_paused AND entry_record.paused_at IS NOT NULL THEN
        UPDATE public.time_entries 
        SET clock_out = NOW(),
            total_paused_duration = total_paused_duration + (NOW() - paused_at),
            is_paused = false,
            paused_at = NULL
        WHERE id = entry_record.id
        RETURNING id, task_id INTO updated_entry_id, updated_task_id;
      ELSE
        UPDATE public.time_entries 
        SET clock_out = NOW()
        WHERE id = entry_record.id
        RETURNING id, task_id INTO updated_entry_id, updated_task_id;
      END IF;
    END IF;
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
