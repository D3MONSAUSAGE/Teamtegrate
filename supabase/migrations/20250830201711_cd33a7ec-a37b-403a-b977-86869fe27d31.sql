-- Add foreign key constraint between employee_schedules.employee_id and users.id
ALTER TABLE public.employee_schedules 
ADD CONSTRAINT fk_employee_schedules_employee_id 
FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;