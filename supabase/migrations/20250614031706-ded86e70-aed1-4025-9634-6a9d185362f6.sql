
-- Phase 1: Database Schema & Policies for Proper Employee Time Tracking

-- Add auto-closure and session management functions
CREATE OR REPLACE FUNCTION public.auto_close_stale_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cutoff_time TIMESTAMP WITH TIME ZONE;
  session_record RECORD;
BEGIN
  -- Close sessions older than 24 hours or that started yesterday
  cutoff_time := NOW() - INTERVAL '24 hours';
  
  FOR session_record IN 
    SELECT id, user_id, clock_in, notes
    FROM public.time_entries 
    WHERE clock_out IS NULL 
    AND (clock_in < cutoff_time OR DATE(clock_in AT TIME ZONE 'UTC') < DATE(NOW() AT TIME ZONE 'UTC'))
  LOOP
    -- Auto-close with note
    UPDATE public.time_entries 
    SET 
      clock_out = LEAST(
        clock_in + INTERVAL '16 hours', -- Max 16 hour session
        DATE_TRUNC('day', clock_in) + INTERVAL '1 day' - INTERVAL '1 minute' -- End of day
      ),
      notes = COALESCE(session_record.notes, '') || ' [Auto-closed: Session exceeded limits]'
    WHERE id = session_record.id;
  END LOOP;
END;
$$;

-- Function to validate session duration (max 16 hours)
CREATE OR REPLACE FUNCTION public.validate_time_entry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  session_duration INTERVAL;
  max_duration INTERVAL := '16 hours';
BEGIN
  -- Only validate on INSERT or UPDATE with clock_out
  IF NEW.clock_out IS NOT NULL THEN
    session_duration := NEW.clock_out - NEW.clock_in;
    
    -- Prevent sessions longer than 16 hours
    IF session_duration > max_duration THEN
      NEW.clock_out := NEW.clock_in + max_duration;
      NEW.notes := COALESCE(NEW.notes, '') || ' [Adjusted: Exceeded maximum session duration]';
    END IF;
    
    -- Prevent negative durations
    IF session_duration < INTERVAL '0 minutes' THEN
      RAISE EXCEPTION 'Clock out time cannot be before clock in time';
    END IF;
    
    -- Prevent future clock times
    IF NEW.clock_in > NOW() OR NEW.clock_out > NOW() THEN
      RAISE EXCEPTION 'Clock times cannot be in the future';
    END IF;
  END IF;
  
  -- Prevent clock-in in the future
  IF NEW.clock_in > NOW() THEN
    RAISE EXCEPTION 'Clock in time cannot be in the future';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for session validation
DROP TRIGGER IF EXISTS validate_time_entry_trigger ON public.time_entries;
CREATE TRIGGER validate_time_entry_trigger
  BEFORE INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.validate_time_entry();

-- Function to prevent multiple active sessions per user
CREATE OR REPLACE FUNCTION public.prevent_multiple_sessions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for existing active session when inserting new entry
  IF TG_OP = 'INSERT' AND NEW.clock_out IS NULL THEN
    -- Close any existing active sessions for this user
    UPDATE public.time_entries 
    SET 
      clock_out = NEW.clock_in - INTERVAL '1 minute',
      notes = COALESCE(notes, '') || ' [Auto-closed: New session started]'
    WHERE user_id = NEW.user_id 
    AND clock_out IS NULL 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to prevent multiple active sessions
DROP TRIGGER IF EXISTS prevent_multiple_sessions_trigger ON public.time_entries;
CREATE TRIGGER prevent_multiple_sessions_trigger
  BEFORE INSERT ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.prevent_multiple_sessions();

-- Create daily time summary table for reporting
CREATE TABLE IF NOT EXISTS public.daily_time_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  work_date DATE NOT NULL,
  total_work_minutes INTEGER DEFAULT 0,
  total_break_minutes INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  break_count INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  compliance_notes TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, work_date)
);

-- Enable RLS on daily summaries
ALTER TABLE public.daily_time_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily summaries
CREATE POLICY "Users can view their own daily summaries"
ON public.daily_time_summaries FOR SELECT
USING (user_id = auth.uid() OR EXISTS(
  SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'superadmin')
));

CREATE POLICY "Users can insert their own daily summaries"
ON public.daily_time_summaries FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can update summaries for approval"
ON public.daily_time_summaries FOR UPDATE
USING (EXISTS(
  SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager', 'superadmin')
));

-- Function to calculate and update daily summaries
CREATE OR REPLACE FUNCTION public.update_daily_summary(target_user_id UUID, target_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  work_minutes INTEGER := 0;
  break_minutes INTEGER := 0;
  session_cnt INTEGER := 0;
  break_cnt INTEGER := 0;
  user_org_id UUID;
  compliance_issues TEXT := '';
BEGIN
  -- Get user's organization
  SELECT organization_id INTO user_org_id 
  FROM public.users WHERE id = target_user_id;
  
  -- Calculate work time (excluding breaks)
  SELECT 
    COALESCE(SUM(duration_minutes), 0),
    COUNT(*)
  INTO work_minutes, session_cnt
  FROM public.time_entries
  WHERE user_id = target_user_id
  AND DATE(clock_in AT TIME ZONE 'UTC') = target_date
  AND clock_out IS NOT NULL
  AND (notes IS NULL OR NOT notes ILIKE '%break%');
  
  -- Calculate break time
  SELECT 
    COALESCE(SUM(duration_minutes), 0),
    COUNT(*)
  INTO break_minutes, break_cnt
  FROM public.time_entries
  WHERE user_id = target_user_id
  AND DATE(clock_in AT TIME ZONE 'UTC') = target_date
  AND clock_out IS NOT NULL
  AND notes ILIKE '%break%';
  
  -- Check compliance issues
  IF work_minutes > 300 AND break_minutes < 30 THEN
    compliance_issues := compliance_issues || 'Missing required 30-min meal break. ';
  END IF;
  
  IF work_minutes > 240 AND break_cnt = 0 THEN
    compliance_issues := compliance_issues || 'Missing required rest breaks. ';
  END IF;
  
  -- Insert or update summary
  INSERT INTO public.daily_time_summaries (
    user_id, organization_id, work_date, total_work_minutes, 
    total_break_minutes, session_count, break_count, 
    overtime_minutes, compliance_notes
  ) VALUES (
    target_user_id, user_org_id, target_date, work_minutes,
    break_minutes, session_cnt, break_cnt,
    GREATEST(0, work_minutes - 480), -- Overtime after 8 hours
    NULLIF(compliance_issues, '')
  )
  ON CONFLICT (user_id, work_date) 
  DO UPDATE SET
    total_work_minutes = EXCLUDED.total_work_minutes,
    total_break_minutes = EXCLUDED.total_break_minutes,
    session_count = EXCLUDED.session_count,
    break_count = EXCLUDED.break_count,
    overtime_minutes = EXCLUDED.overtime_minutes,
    compliance_notes = EXCLUDED.compliance_notes,
    updated_at = NOW();
END;
$$;

-- Function to auto-update summaries when time entries change
CREATE OR REPLACE FUNCTION public.trigger_daily_summary_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update summary for the affected date(s)
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_daily_summary(OLD.user_id, DATE(OLD.clock_in AT TIME ZONE 'UTC'));
    RETURN OLD;
  ELSE
    PERFORM public.update_daily_summary(NEW.user_id, DATE(NEW.clock_in AT TIME ZONE 'UTC'));
    -- If clock_out date is different, update that day too
    IF NEW.clock_out IS NOT NULL AND DATE(NEW.clock_out AT TIME ZONE 'UTC') != DATE(NEW.clock_in AT TIME ZONE 'UTC') THEN
      PERFORM public.update_daily_summary(NEW.user_id, DATE(NEW.clock_out AT TIME ZONE 'UTC'));
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger to auto-update daily summaries
DROP TRIGGER IF EXISTS update_daily_summary_trigger ON public.time_entries;
CREATE TRIGGER update_daily_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.trigger_daily_summary_update();

-- Function to automatically close sessions at end of business day
CREATE OR REPLACE FUNCTION public.end_of_day_auto_close()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  business_day_end TIME := '23:59:59';
  session_record RECORD;
BEGIN
  -- Close all active sessions at end of business day
  FOR session_record IN 
    SELECT id, user_id, clock_in
    FROM public.time_entries 
    WHERE clock_out IS NULL 
    AND clock_in::DATE < CURRENT_DATE
  LOOP
    UPDATE public.time_entries 
    SET 
      clock_out = DATE_TRUNC('day', session_record.clock_in) + INTERVAL '23 hours 59 minutes',
      notes = COALESCE(notes, '') || ' [Auto-closed: End of business day]'
    WHERE id = session_record.id;
  END LOOP;
END;
$$;
