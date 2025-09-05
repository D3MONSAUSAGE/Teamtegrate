-- Update request_types SELECT policy to include global defaults (org = all-zero UUID)
DROP POLICY IF EXISTS "Users can view request types in their organization" ON public.request_types;

CREATE POLICY "Users can view request types in org or global" 
ON public.request_types FOR SELECT 
USING (
  organization_id = get_current_user_organization_id()
  OR organization_id = '00000000-0000-0000-0000-000000000000'
);