-- Add team-level clock-in policy setting
ALTER TABLE teams 
ADD COLUMN require_schedule_for_clock_in BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN teams.require_schedule_for_clock_in IS 
'Team-level override for clock-in policy. NULL = inherit from organization settings, true = require schedule, false = allow without schedule';