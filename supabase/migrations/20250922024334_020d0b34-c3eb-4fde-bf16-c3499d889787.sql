-- Fix RLS policy for inventory_counts UPDATE to allow superadmins/admins and assigned users
DROP POLICY IF EXISTS "Users can update counts they conducted" ON public.inventory_counts;

CREATE POLICY "Users can update counts they have access to" ON public.inventory_counts
FOR UPDATE USING (
  (organization_id = get_current_user_organization_id()) AND 
  (
    (conducted_by = auth.uid()) OR 
    (assigned_to = auth.uid()) OR 
    (get_current_user_role() = ANY (ARRAY['admin'::text, 'superadmin'::text]))
  )
);