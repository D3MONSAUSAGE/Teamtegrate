-- Security hardening: drop public SELECT policy on invoices
DROP POLICY IF EXISTS "Users can view invoices" ON public.invoices;