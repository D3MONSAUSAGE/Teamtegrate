-- Add DELETE policy for request_types table to allow only admins and superadmins
CREATE POLICY "Admins can delete request types" ON public.request_types
FOR DELETE USING (
  organization_id = get_current_user_organization_id() 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);