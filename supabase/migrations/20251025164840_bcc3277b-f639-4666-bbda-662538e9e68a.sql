-- ============================================================
-- California Sick Leave Compliance Migration
-- ============================================================

-- ============================================================
-- 1. Add California compliance columns to employee_time_off_balances
-- ============================================================
ALTER TABLE employee_time_off_balances
ADD COLUMN IF NOT EXISTS accrual_method VARCHAR(20) DEFAULT 'frontload',
ADD COLUMN IF NOT EXISTS waiting_period_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS waiting_period_start_date DATE,
ADD COLUMN IF NOT EXISTS can_use_after_date DATE,
ADD COLUMN IF NOT EXISTS max_balance_cap INTEGER,
ADD COLUMN IF NOT EXISTS is_california_compliant BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_frontload_date DATE,
ADD COLUMN IF NOT EXISTS carryover_from_previous_year INTEGER DEFAULT 0;

-- Add index for performance on waiting period queries
CREATE INDEX IF NOT EXISTS idx_time_off_balances_waiting_period 
ON employee_time_off_balances(can_use_after_date);

COMMENT ON COLUMN employee_time_off_balances.accrual_method IS 'Accrual method: frontload or per_30_hours';
COMMENT ON COLUMN employee_time_off_balances.is_california_compliant IS 'Whether this balance follows California sick leave law';
COMMENT ON COLUMN employee_time_off_balances.max_balance_cap IS 'Maximum balance hours (80 for CA sick leave)';

-- ============================================================
-- 2. Create accrual history tracking table
-- ============================================================
CREATE TABLE IF NOT EXISTS time_off_accrual_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance_id UUID NOT NULL REFERENCES employee_time_off_balances(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('frontload', 'carryover', 'manual_adjustment', 'admin_grant')),
  hours_change DECIMAL(10,2) NOT NULL,
  hours_before DECIMAL(10,2) NOT NULL,
  hours_after DECIMAL(10,2) NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_accrual_history_user ON time_off_accrual_history(user_id);
CREATE INDEX idx_accrual_history_balance ON time_off_accrual_history(balance_id);
CREATE INDEX idx_accrual_history_date ON time_off_accrual_history(created_at);
CREATE INDEX idx_accrual_history_org ON time_off_accrual_history(organization_id);

-- Enable RLS
ALTER TABLE time_off_accrual_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for accrual history
CREATE POLICY "Users can view accrual history in their organization"
  ON time_off_accrual_history FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert accrual history"
  ON time_off_accrual_history FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

COMMENT ON TABLE time_off_accrual_history IS 'Audit trail for all time off accrual transactions';

-- ============================================================
-- 3. Function to validate time off requests (90-day waiting period)
-- ============================================================
CREATE OR REPLACE FUNCTION validate_time_off_request()
RETURNS TRIGGER AS $$
DECLARE
  v_can_use_date DATE;
  v_balance_total DECIMAL;
  v_balance_used DECIMAL;
  v_is_ca_compliant BOOLEAN;
BEGIN
  -- Check if sick leave and validate
  IF NEW.leave_type = 'sick' THEN
    SELECT 
      can_use_after_date, 
      total_hours, 
      used_hours,
      is_california_compliant
    INTO 
      v_can_use_date, 
      v_balance_total, 
      v_balance_used,
      v_is_ca_compliant
    FROM employee_time_off_balances
    WHERE user_id = NEW.user_id
      AND leave_type = 'sick'
      AND year = EXTRACT(YEAR FROM NEW.start_date);
    
    -- Enforce 90-day waiting period for California compliant sick leave
    IF v_is_ca_compliant AND v_can_use_date IS NOT NULL AND CURRENT_DATE < v_can_use_date THEN
      RAISE EXCEPTION 'Cannot use sick leave until waiting period ends on %. California law requires a 90-day waiting period from hire date.', v_can_use_date;
    END IF;
    
    -- Check sufficient balance
    IF (v_balance_total - v_balance_used) < NEW.hours_requested THEN
      RAISE EXCEPTION 'Insufficient sick leave balance. Available: % hours, Requested: % hours', 
        (v_balance_total - v_balance_used), 
        NEW.hours_requested;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for request validation
DROP TRIGGER IF EXISTS trigger_validate_time_off_request ON time_off_requests;
CREATE TRIGGER trigger_validate_time_off_request
  BEFORE INSERT ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_time_off_request();

-- ============================================================
-- 4. Function to log accrual history when balances are created
-- ============================================================
CREATE OR REPLACE FUNCTION log_initial_balance_accrual()
RETURNS TRIGGER AS $$
BEGIN
  -- Log initial frontload for California compliant sick leave
  IF NEW.is_california_compliant AND NEW.leave_type = 'sick' THEN
    INSERT INTO time_off_accrual_history (
      organization_id,
      user_id,
      balance_id,
      leave_type,
      transaction_type,
      hours_change,
      hours_before,
      hours_after,
      reason,
      created_by
    ) VALUES (
      NEW.organization_id,
      NEW.user_id,
      NEW.id,
      NEW.leave_type,
      'frontload',
      NEW.total_hours,
      0,
      NEW.total_hours,
      'Initial California-compliant sick leave frontload',
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-log initial balances
DROP TRIGGER IF EXISTS trigger_log_initial_balance ON employee_time_off_balances;
CREATE TRIGGER trigger_log_initial_balance
  AFTER INSERT ON employee_time_off_balances
  FOR EACH ROW
  EXECUTE FUNCTION log_initial_balance_accrual();