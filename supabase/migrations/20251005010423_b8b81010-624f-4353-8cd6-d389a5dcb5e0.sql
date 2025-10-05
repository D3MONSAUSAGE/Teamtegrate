-- Step 1: Add hourly_rate to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 15.00;

COMMENT ON COLUMN public.users.hourly_rate IS 'Employee hourly wage rate for labor cost calculations';

-- Step 2: Add labor_cost to time_entries (calculated field)
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(10,2);

COMMENT ON COLUMN public.time_entries.labor_cost IS 'Calculated labor cost: (hours worked × hourly_rate)';

-- Step 3: Add calculated_labor_cost to daily_time_summaries
ALTER TABLE public.daily_time_summaries
ADD COLUMN IF NOT EXISTS calculated_labor_cost NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN public.daily_time_summaries.calculated_labor_cost IS 'Daily labor cost calculated from time entries';

-- Step 4: Create function to calculate labor cost for a time entry
CREATE OR REPLACE FUNCTION public.calculate_time_entry_labor_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_hourly_rate NUMERIC(10,2);
  hours_worked NUMERIC(10,4);
BEGIN
  -- Only calculate when clock_out is set
  IF NEW.clock_out IS NOT NULL THEN
    -- Get user's hourly rate
    SELECT hourly_rate INTO user_hourly_rate
    FROM public.users
    WHERE id = NEW.user_id;
    
    -- Calculate hours worked (duration_minutes already calculated by existing trigger)
    IF NEW.duration_minutes IS NOT NULL THEN
      hours_worked := NEW.duration_minutes / 60.0;
      
      -- Calculate labor cost
      NEW.labor_cost := ROUND(hours_worked * COALESCE(user_hourly_rate, 15.00), 2);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger to calculate labor cost on time entry insert/update
DROP TRIGGER IF EXISTS calculate_labor_cost_trigger ON public.time_entries;
CREATE TRIGGER calculate_labor_cost_trigger
  BEFORE INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_time_entry_labor_cost();

-- Step 6: Update daily_time_summaries to include labor costs
CREATE OR REPLACE FUNCTION public.update_daily_summary_with_labor_cost(target_user_id uuid, target_date date)
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
  total_labor_cost NUMERIC(10,2) := 0;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO user_org_id 
  FROM public.users WHERE id = target_user_id;
  
  -- Calculate work time and labor cost (excluding breaks)
  SELECT 
    COALESCE(SUM(duration_minutes), 0),
    COUNT(*),
    COALESCE(SUM(labor_cost), 0)
  INTO work_minutes, session_cnt, total_labor_cost
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
  
  -- Insert or update summary with labor cost
  INSERT INTO public.daily_time_summaries (
    user_id, organization_id, work_date, total_work_minutes, 
    total_break_minutes, session_count, break_count, 
    overtime_minutes, compliance_notes, calculated_labor_cost
  ) VALUES (
    target_user_id, user_org_id, target_date, work_minutes,
    break_minutes, session_cnt, break_cnt,
    GREATEST(0, work_minutes - 480), -- Overtime after 8 hours
    NULLIF(compliance_issues, ''),
    total_labor_cost
  )
  ON CONFLICT (user_id, work_date) 
  DO UPDATE SET
    total_work_minutes = EXCLUDED.total_work_minutes,
    total_break_minutes = EXCLUDED.total_break_minutes,
    session_count = EXCLUDED.session_count,
    break_count = EXCLUDED.break_count,
    overtime_minutes = EXCLUDED.overtime_minutes,
    compliance_notes = EXCLUDED.compliance_notes,
    calculated_labor_cost = EXCLUDED.calculated_labor_cost,
    updated_at = NOW();
END;
$$;

-- Step 7: Create weekly_payroll_summary view based on actual time entries
CREATE OR REPLACE VIEW public.weekly_payroll_summary AS
SELECT 
  u.organization_id,
  DATE_TRUNC('week', dts.work_date)::date as week_start,
  dts.user_id,
  u.name as employee_name,
  u.email as employee_email,
  t.id as team_id,
  t.name as team_name,
  SUM(dts.total_work_minutes) as total_minutes,
  ROUND(SUM(dts.total_work_minutes) / 60.0, 2) as total_hours,
  SUM(dts.overtime_minutes) as overtime_minutes,
  ROUND(SUM(dts.overtime_minutes) / 60.0, 2) as overtime_hours,
  SUM(dts.calculated_labor_cost) as total_labor_cost,
  u.hourly_rate,
  COUNT(DISTINCT dts.work_date) as days_worked
FROM public.daily_time_summaries dts
JOIN public.users u ON u.id = dts.user_id
LEFT JOIN public.team_memberships tm ON tm.user_id = u.id
LEFT JOIN public.teams t ON t.id = tm.team_id
GROUP BY 
  u.organization_id,
  DATE_TRUNC('week', dts.work_date)::date,
  dts.user_id,
  u.name,
  u.email,
  t.id,
  t.name,
  u.hourly_rate;

COMMENT ON VIEW public.weekly_payroll_summary IS 'Aggregated weekly payroll data from actual time entries';

-- Step 8: Update existing daily_time_summaries to recalculate with labor costs
-- (Only for recent data to avoid long processing)
DO $$
DECLARE
  summary_record RECORD;
BEGIN
  FOR summary_record IN 
    SELECT DISTINCT user_id, work_date 
    FROM public.daily_time_summaries 
    WHERE work_date >= CURRENT_DATE - INTERVAL '30 days'
  LOOP
    PERFORM public.update_daily_summary_with_labor_cost(
      summary_record.user_id, 
      summary_record.work_date
    );
  END LOOP;
END $$;