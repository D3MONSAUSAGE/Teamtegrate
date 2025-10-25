-- Function to update time off balances when request is approved
CREATE OR REPLACE FUNCTION update_time_off_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Don't deduct for unpaid leave
    IF NEW.leave_type != 'unpaid' THEN
      UPDATE employee_time_off_balances
      SET 
        used_hours = used_hours + NEW.hours_requested,
        updated_at = NOW()
      WHERE 
        user_id = NEW.user_id 
        AND leave_type = NEW.leave_type
        AND year = EXTRACT(YEAR FROM NEW.start_date::date)
        AND organization_id = NEW.organization_id;
    END IF;
  END IF;
  
  -- Restore balance if request is denied or cancelled after being approved
  IF (NEW.status = 'denied' OR NEW.status = 'cancelled') AND OLD.status = 'approved' THEN
    IF NEW.leave_type != 'unpaid' THEN
      UPDATE employee_time_off_balances
      SET 
        used_hours = GREATEST(0, used_hours - NEW.hours_requested),
        updated_at = NOW()
      WHERE 
        user_id = NEW.user_id 
        AND leave_type = NEW.leave_type
        AND year = EXTRACT(YEAR FROM NEW.start_date::date)
        AND organization_id = NEW.organization_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_time_off_balance ON time_off_requests;
CREATE TRIGGER trigger_update_time_off_balance
  AFTER UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_time_off_balance_on_approval();