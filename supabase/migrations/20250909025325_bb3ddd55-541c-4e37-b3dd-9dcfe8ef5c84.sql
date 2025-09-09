-- Add foreign key constraints and fix relationships
-- First, add foreign key constraint between requests and users
ALTER TABLE public.requests 
ADD CONSTRAINT requests_requested_by_fkey 
FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add foreign key constraint between requests and request_types  
ALTER TABLE public.requests
ADD CONSTRAINT requests_request_type_id_fkey
FOREIGN KEY (request_type_id) REFERENCES public.request_types(id) ON DELETE RESTRICT;

-- Add foreign key constraint between request_approvals and users
ALTER TABLE public.request_approvals
ADD CONSTRAINT request_approvals_approver_id_fkey
FOREIGN KEY (approver_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add foreign key constraint between request_comments and users
ALTER TABLE public.request_comments
ADD CONSTRAINT request_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update RLS policies to be more reliable
DROP POLICY IF EXISTS "Users can view requests in their organization" ON public.requests;
CREATE POLICY "Users can view requests in their organization"
  ON public.requests FOR SELECT
  USING (organization_id = get_current_user_organization_id());

DROP POLICY IF EXISTS "Users can create requests in their organization" ON public.requests;
CREATE POLICY "Users can create requests in their organization"
  ON public.requests FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id() AND 
    requested_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own requests or admins can update all" ON public.requests;
CREATE POLICY "Users can update requests in their organization"
  ON public.requests FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id() AND
    (requested_by = auth.uid() OR 
     EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')))
  );

-- Enable realtime for requests table
ALTER TABLE public.requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;

-- Enable realtime for request_approvals table  
ALTER TABLE public.request_approvals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_approvals;