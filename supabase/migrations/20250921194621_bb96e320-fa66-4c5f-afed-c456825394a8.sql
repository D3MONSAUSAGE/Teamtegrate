-- Add RLS policies for inventory template deletion

-- Policy: Managers can delete templates they created
CREATE POLICY "Managers can delete their own templates" ON inventory_templates
FOR UPDATE USING (
  organization_id = get_current_user_organization_id() 
  AND created_by = auth.uid()::text 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'admin', 'superadmin')
  )
);

-- Policy: Admins and superadmins can delete any template in their organization
CREATE POLICY "Admins can delete any template in organization" ON inventory_templates
FOR UPDATE USING (
  organization_id = get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);