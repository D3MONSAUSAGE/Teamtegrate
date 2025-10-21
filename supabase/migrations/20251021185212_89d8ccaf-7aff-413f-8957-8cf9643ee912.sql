-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Superadmins can update their organization" ON organizations;

-- Create new policy that allows both superadmins and admins
CREATE POLICY "Admins and superadmins can update their organization"
ON organizations
FOR UPDATE
TO authenticated
USING (
  id = (SELECT organization_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('superadmin', 'admin')
  )
)
WITH CHECK (
  id = (SELECT organization_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('superadmin', 'admin')
  )
);