
-- Update journal entries RLS policies to allow admin/superadmin access
DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can view public journal entries" ON journal_entries;

CREATE POLICY "Users can view own journal entries" ON journal_entries
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public journal entries" ON journal_entries
FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can view all journal entries in organization" ON journal_entries
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u1, users u2
    WHERE u1.id = auth.uid()
    AND u2.id = journal_entries.user_id
    AND u1.organization_id = u2.organization_id
    AND u1.role IN ('admin', 'superadmin')
  )
);

-- Update time entries policies for admin access
CREATE POLICY "Admins can view all time entries in organization" ON time_entries
FOR SELECT USING (
  organization_id = get_current_user_organization_id() AND
  (
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'superadmin')
  )
);

-- Create admin access audit log table
CREATE TABLE IF NOT EXISTS admin_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  organization_id UUID NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on admin access audit
ALTER TABLE admin_access_audit ENABLE ROW LEVEL SECURITY;

-- Policy for admin access audit - only admins can insert and view
CREATE POLICY "Admins can insert audit logs" ON admin_access_audit
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
    AND organization_id = admin_access_audit.organization_id
  )
);

CREATE POLICY "Admins can view audit logs in their organization" ON admin_access_audit
FOR SELECT USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);
