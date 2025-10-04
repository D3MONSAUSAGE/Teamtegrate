-- Add area column to employee_schedules table for location assignment
ALTER TABLE employee_schedules 
ADD COLUMN area text;