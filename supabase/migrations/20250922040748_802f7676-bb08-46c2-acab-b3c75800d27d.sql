-- Create RPC function for time entry approval
CREATE OR REPLACE FUNCTION approve_time_entry(
  entry_id UUID,
  approval_action TEXT,
  approval_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role TEXT;
  current_user_org UUID;
  entry_org UUID;
  result JSONB;
BEGIN
  -- Get current user role and organization
  SELECT role, organization_id INTO current_user_role, current_user_org
  FROM users WHERE id = auth.uid();
  
  -- Check if user has permission to approve
  IF current_user_role NOT IN ('manager', 'admin', 'superadmin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Get entry organization to verify access
  SELECT organization_id INTO entry_org
  FROM time_entries WHERE id = entry_id;
  
  IF entry_org != current_user_org THEN
    RETURN jsonb_build_object('success', false, 'error', 'Entry not found or access denied');
  END IF;
  
  -- Update the time entry
  UPDATE time_entries 
  SET 
    approval_status = approval_action::approval_status,
    approved_by = auth.uid(),
    approved_at = NOW(),
    approval_notes = COALESCE(approval_notes, approval_notes)
  WHERE id = entry_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Time entry not found');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Time entry ' || approval_action || 'd successfully');
END;
$$;

-- Add approval_notes column to time_entries if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_entries' AND column_name = 'approval_notes'
  ) THEN
    ALTER TABLE time_entries ADD COLUMN approval_notes TEXT;
  END IF;
END $$;

-- Ensure time_entries have proper defaults for approval fields
UPDATE time_entries 
SET approval_status = 'pending'
WHERE approval_status IS NULL;

-- Add index for efficient approval queries
CREATE INDEX IF NOT EXISTS idx_time_entries_approval_status 
ON time_entries(organization_id, approval_status, clock_out DESC);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_time_entry TO authenticated;