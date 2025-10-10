-- Add HR management columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'on_leave', 'terminated')),
ADD COLUMN IF NOT EXISTS salary_type TEXT DEFAULT 'hourly' CHECK (salary_type IN ('hourly', 'salary', 'contract')),
ADD COLUMN IF NOT EXISTS hr_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.hire_date IS 'Employee hire date for HR tracking';
COMMENT ON COLUMN public.users.job_title IS 'Employee job title/position';
COMMENT ON COLUMN public.users.department IS 'Department the employee belongs to';
COMMENT ON COLUMN public.users.employment_status IS 'Current employment status: active, on_leave, or terminated';
COMMENT ON COLUMN public.users.salary_type IS 'Type of compensation: hourly, salary, or contract';
COMMENT ON COLUMN public.users.hourly_rate IS 'Hourly rate for payroll calculations (default $15)';
COMMENT ON COLUMN public.users.hr_notes IS 'Internal HR notes about the employee';