-- Enable RLS on migration log table
ALTER TABLE checklist_v1_to_v2_migration_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to view migration logs
CREATE POLICY "Admins can view migration logs"
ON checklist_v1_to_v2_migration_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'superadmin')
  )
);