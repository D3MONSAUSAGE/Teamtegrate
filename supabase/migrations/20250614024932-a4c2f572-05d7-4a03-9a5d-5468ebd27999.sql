
-- Clean up orphaned time tracking sessions by setting clock_out times
-- For sessions older than 8 hours, assume they ended after 8 hours of work
-- For recent sessions (today), set clock_out to now

UPDATE time_entries 
SET 
  clock_out = CASE 
    -- For sessions from today, assume they should be closed now
    WHEN DATE(clock_in) = CURRENT_DATE THEN NOW()
    -- For older sessions, assume 8 hours of work
    ELSE clock_in + INTERVAL '8 hours'
  END,
  duration_minutes = CASE 
    -- For sessions from today, calculate actual time to now
    WHEN DATE(clock_in) = CURRENT_DATE THEN EXTRACT(EPOCH FROM (NOW() - clock_in))/60
    -- For older sessions, set to 8 hours (480 minutes)
    ELSE 480
  END
WHERE clock_out IS NULL;

-- Add a note to these cleaned up sessions to indicate they were auto-closed
UPDATE time_entries 
SET notes = CASE 
  WHEN notes IS NULL OR notes = '' THEN 'Auto-closed due to incomplete session'
  ELSE notes || ' (Auto-closed due to incomplete session)'
END
WHERE clock_out IS NOT NULL 
  AND (notes LIKE '%Auto-closed%' OR 
       created_at < NOW() - INTERVAL '1 hour');

-- Create an index to improve performance for active session checks
CREATE INDEX IF NOT EXISTS idx_time_entries_active_sessions 
ON time_entries(user_id, organization_id, clock_out) 
WHERE clock_out IS NULL;
