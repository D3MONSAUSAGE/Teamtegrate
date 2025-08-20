
-- Enable realtime for employee_schedules table
ALTER TABLE public.employee_schedules REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_schedules;
