-- Update RLS policy for inventory_template_items to allow managers/admins to add items
DROP POLICY IF EXISTS "Only template creators can manage template items" ON inventory_template_items;

-- Create new policy that allows managers/admins to add items to any template in their organization
CREATE POLICY "Managers can manage template items in their organization" 
ON inventory_template_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM inventory_templates it
    WHERE it.id = inventory_template_items.template_id
    AND it.organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND (
      -- Template creator can always manage
      it.created_by = auth.uid()
      OR
      -- Managers, admins, and superadmins can manage any template in their org
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = ANY (ARRAY['manager', 'admin', 'superadmin'])
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM inventory_templates it
    WHERE it.id = inventory_template_items.template_id
    AND it.organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND (
      -- Template creator can always manage
      it.created_by = auth.uid()
      OR
      -- Managers, admins, and superadmins can manage any template in their org
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = ANY (ARRAY['manager', 'admin', 'superadmin'])
      )
    )
  )
);