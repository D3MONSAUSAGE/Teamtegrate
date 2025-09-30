-- ============================================
-- PHASE 1: CRITICAL SECURITY FIXES
-- ============================================

-- 1. Drop old verification policy if exists
DROP POLICY IF EXISTS "entries_v2_verify_managers" ON checklist_item_entries_v2;

-- 2. Create strict verification policy
-- Only managers/admins can update verified_status
CREATE POLICY "entries_v2_verify_managers_strict"
ON checklist_item_entries_v2
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM checklist_instances_v2 ci
    WHERE ci.id = checklist_item_entries_v2.instance_id
      AND ci.org_id = get_current_user_organization_id()
      AND ci.status = 'submitted'
      AND get_current_user_role() IN ('manager', 'admin', 'superadmin')
  )
);

-- 3. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_instances_v2_executed_by 
ON checklist_instances_v2(executed_by);

CREATE INDEX IF NOT EXISTS idx_instances_v2_verified_by 
ON checklist_instances_v2(verified_by);

CREATE INDEX IF NOT EXISTS idx_instances_v2_status_date 
ON checklist_instances_v2(status, date);

CREATE INDEX IF NOT EXISTS idx_entries_v2_status_combo 
ON checklist_item_entries_v2(executed_status, verified_status);

CREATE INDEX IF NOT EXISTS idx_entries_v2_instance_position 
ON checklist_item_entries_v2(instance_id, position);

-- 4. Add audit function for verification attempts
CREATE OR REPLACE FUNCTION audit_verification_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when someone tries to verify
  IF NEW.verified_status IS DISTINCT FROM OLD.verified_status THEN
    RAISE LOG 'Verification attempt: user=%, instance=%, old_status=%, new_status=%',
      auth.uid(), NEW.instance_id, OLD.verified_status, NEW.verified_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach audit trigger
DROP TRIGGER IF EXISTS trigger_audit_verification ON checklist_item_entries_v2;
CREATE TRIGGER trigger_audit_verification
  BEFORE UPDATE ON checklist_item_entries_v2
  FOR EACH ROW
  WHEN (NEW.verified_status IS DISTINCT FROM OLD.verified_status)
  EXECUTE FUNCTION audit_verification_attempt();