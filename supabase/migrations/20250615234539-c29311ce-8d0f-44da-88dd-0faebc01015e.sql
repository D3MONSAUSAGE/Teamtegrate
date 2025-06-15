
-- Skip bucket creation since it already exists, just add the missing RLS policies

-- Add RLS policies for the invoices table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Users can view invoices from their organization
CREATE POLICY "invoices_select_organization" 
ON public.invoices 
FOR SELECT 
TO authenticated
USING (organization_id = public.get_current_user_organization_id());

-- Users with manager+ permissions can insert invoices
CREATE POLICY "invoices_insert_managers_plus" 
ON public.invoices 
FOR INSERT 
TO authenticated
WITH CHECK (
  organization_id = public.get_current_user_organization_id()
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager', 'admin', 'superadmin')
);

-- Users with manager+ permissions can update invoices in their organization
CREATE POLICY "invoices_update_managers_plus" 
ON public.invoices 
FOR UPDATE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager', 'admin', 'superadmin')
);

-- Users with manager+ permissions can delete invoices in their organization
CREATE POLICY "invoices_delete_managers_plus" 
ON public.invoices 
FOR DELETE 
TO authenticated
USING (
  organization_id = public.get_current_user_organization_id()
  AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager', 'admin', 'superadmin')
);
