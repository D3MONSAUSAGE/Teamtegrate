-- Make schedule validation optional based on organization settings
-- First, ensure all organizations have a default setting
INSERT INTO public.organization_attendance_settings (
  organization_id,
  require_schedule_for_clock_in,
  allow_early_clock_in_minutes,
  allow_late_clock_in_minutes,
  created_at,
  updated_at
)
SELECT DISTINCT 
  organization_id,
  false, -- Default to NOT requiring schedules
  30,    -- Allow 30 minutes early
  30,    -- Allow 30 minutes late
  now(),
  now()
FROM public.users
WHERE organization_id IS NOT NULL
  AND organization_id NOT IN (
    SELECT organization_id 
    FROM public.organization_attendance_settings 
    WHERE organization_id IS NOT NULL
  )
ON CONFLICT (organization_id) DO NOTHING;