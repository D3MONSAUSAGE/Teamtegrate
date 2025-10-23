-- Add offboarding fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS eligible_for_rehire BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS termination_reason TEXT,
ADD COLUMN IF NOT EXISTS termination_notes TEXT,
ADD COLUMN IF NOT EXISTS offboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_day_worked DATE;

-- Create employee_offboarding table
CREATE TABLE IF NOT EXISTS employee_offboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  initiated_by UUID REFERENCES users(id),
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  termination_date DATE NOT NULL,
  last_day_worked DATE,
  termination_type TEXT NOT NULL CHECK (termination_type IN ('voluntary', 'involuntary', 'layoff', 'retirement')),
  termination_reason TEXT,
  eligible_for_rehire BOOLEAN DEFAULT true,
  offboarding_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES users(id),
  
  -- Checklist items
  access_revoked BOOLEAN DEFAULT false,
  access_revoked_at TIMESTAMP WITH TIME ZONE,
  equipment_returned BOOLEAN DEFAULT false,
  equipment_notes TEXT,
  exit_interview_completed BOOLEAN DEFAULT false,
  exit_interview_notes TEXT,
  final_payroll_processed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE employee_offboarding ENABLE ROW LEVEL SECURITY;

-- Policies for employee_offboarding
CREATE POLICY "Users can view offboarding records in their organization"
ON employee_offboarding FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can create offboarding records"
ON employee_offboarding FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Admins can update offboarding records"
ON employee_offboarding FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

-- Create function to revoke user access
CREATE OR REPLACE FUNCTION revoke_user_access(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  auth_user_id UUID;
  org_id UUID;
BEGIN
  -- Get the user's organization
  SELECT organization_id INTO org_id FROM users WHERE id = target_user_id;
  
  IF org_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update employment status
  UPDATE users 
  SET 
    employment_status = 'terminated',
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Delete auth.users record to revoke access (preserves users table record)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Mark access as revoked in offboarding record
  UPDATE employee_offboarding
  SET 
    access_revoked = true,
    access_revoked_at = now(),
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_employee_offboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_offboarding_updated_at
BEFORE UPDATE ON employee_offboarding
FOR EACH ROW
EXECUTE FUNCTION update_employee_offboarding_updated_at();