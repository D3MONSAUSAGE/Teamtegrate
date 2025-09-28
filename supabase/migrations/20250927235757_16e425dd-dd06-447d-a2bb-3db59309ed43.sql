-- Grant necessary permissions for warehouse_items table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouse_items TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Ensure the RLS policies work correctly by refreshing them
DROP POLICY IF EXISTS "Managers can manage warehouse items" ON public.warehouse_items;
DROP POLICY IF EXISTS "Users can view warehouse items in their organization" ON public.warehouse_items;

-- Recreate the management policy with explicit UPDATE permission
CREATE POLICY "Managers can manage warehouse items" 
ON public.warehouse_items 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_items.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  ) 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_items.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  ) 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = ANY(ARRAY['manager', 'admin', 'superadmin'])
  )
);

-- Recreate the view policy
CREATE POLICY "Users can view warehouse items in their organization" 
ON public.warehouse_items 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM warehouses w 
    WHERE w.id = warehouse_items.warehouse_id 
    AND w.organization_id = get_current_user_organization_id()
  )
);