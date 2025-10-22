-- Add new fields to users table for comprehensive HR management
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS employee_number TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS termination_date DATE,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create unique index on employee_number where not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_employee_number 
  ON users(employee_number) 
  WHERE employee_number IS NOT NULL;

-- Create index on department for filtering
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- Create employee_time_off_balances table
CREATE TABLE IF NOT EXISTS employee_time_off_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'unpaid')),
  total_hours NUMERIC DEFAULT 0 CHECK (total_hours >= 0),
  used_hours NUMERIC DEFAULT 0 CHECK (used_hours >= 0),
  accrual_rate NUMERIC DEFAULT 0 CHECK (accrual_rate >= 0),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, leave_type, year)
);

-- Enable RLS on employee_time_off_balances
ALTER TABLE employee_time_off_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employee_time_off_balances
CREATE POLICY "Users can view their own time off balances"
  ON employee_time_off_balances FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = employee_time_off_balances.organization_id
      AND users.role IN ('admin', 'superadmin', 'manager')
    )
  );

CREATE POLICY "Admins can insert time off balances"
  ON employee_time_off_balances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = employee_time_off_balances.organization_id
      AND users.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can update time off balances"
  ON employee_time_off_balances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = employee_time_off_balances.organization_id
      AND users.role IN ('admin', 'superadmin', 'manager')
    )
  );

CREATE POLICY "Admins can delete time off balances"
  ON employee_time_off_balances FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = employee_time_off_balances.organization_id
      AND users.role IN ('admin', 'superadmin')
    )
  );

-- Create time_off_requests table
CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours_requested NUMERIC NOT NULL CHECK (hours_requested > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  denial_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- Enable RLS on time_off_requests
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for time_off_requests
CREATE POLICY "Users can view their own time off requests"
  ON time_off_requests FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = time_off_requests.organization_id
      AND users.role IN ('admin', 'superadmin', 'manager', 'team_leader')
    )
  );

CREATE POLICY "Users can create their own time off requests"
  ON time_off_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests"
  ON time_off_requests FOR UPDATE
  USING (
    auth.uid() = user_id AND status = 'pending'
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.organization_id = time_off_requests.organization_id
      AND users.role IN ('admin', 'superadmin', 'manager')
    )
  );

-- Create indexes for time_off_requests
CREATE INDEX IF NOT EXISTS idx_time_off_requests_user_id ON time_off_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_dates ON time_off_requests(start_date, end_date);

-- Create indexes for employee_time_off_balances
CREATE INDEX IF NOT EXISTS idx_time_off_balances_user_id ON employee_time_off_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_balances_year ON employee_time_off_balances(year);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_off_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_off_balances_updated_at
  BEFORE UPDATE ON employee_time_off_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_time_off_updated_at();

CREATE TRIGGER update_time_off_requests_updated_at
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_time_off_updated_at();