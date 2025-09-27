-- Add team_id columns to tables for team-based data segregation
ALTER TABLE public.created_invoices 
ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.inventory_transactions 
ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.invoice_clients 
ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- Update RLS policies for created_invoices to include team-based access
DROP POLICY IF EXISTS "Users can create invoices in their organization" ON public.created_invoices;
DROP POLICY IF EXISTS "Users can view invoices in their organization" ON public.created_invoices;
DROP POLICY IF EXISTS "Managers can update invoices in their organization" ON public.created_invoices;

CREATE POLICY "Users can create invoices for their teams" 
ON public.created_invoices FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  (
    -- Admins can create for any team
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Managers can create for their managed teams
    (team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())) OR
    -- Allow null team_id for backward compatibility
    team_id IS NULL
  )
);

CREATE POLICY "Users can view invoices based on role and team" 
ON public.created_invoices FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND
  (
    -- Admins see all invoices
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Managers see their team's invoices
    (team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())) OR
    -- Allow viewing invoices without team_id for backward compatibility
    team_id IS NULL
  )
);

CREATE POLICY "Managers can update invoices for their teams" 
ON public.created_invoices FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  (
    -- Admins can update any invoice
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Managers can update their team's invoices
    (team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid()))
  )
);

-- Update RLS policies for inventory_transactions to include team-based access
DROP POLICY IF EXISTS "Users can create transactions in their organization" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Users can view transactions in their organization" ON public.inventory_transactions;

CREATE POLICY "Users can create transactions for their teams" 
ON public.inventory_transactions FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  (
    -- Admins can create for any team
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Managers can create for their managed teams
    (team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())) OR
    -- Allow null team_id for backward compatibility
    team_id IS NULL
  )
);

CREATE POLICY "Users can view transactions based on role and team" 
ON public.inventory_transactions FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND
  (
    -- Admins see all transactions
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Managers see their team's transactions
    (team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())) OR
    -- Allow viewing transactions without team_id for backward compatibility
    team_id IS NULL
  )
);

-- Update RLS policies for invoice_clients to include team-based access
DROP POLICY IF EXISTS "Users can create clients in their organization" ON public.invoice_clients;
DROP POLICY IF EXISTS "Users can view clients in their organization" ON public.invoice_clients;
DROP POLICY IF EXISTS "Users can update clients in their organization" ON public.invoice_clients;

CREATE POLICY "Users can create clients for their teams" 
ON public.invoice_clients FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  (
    -- Admins can create for any team
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Managers can create for their managed teams
    (team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())) OR
    -- Allow null team_id for backward compatibility
    team_id IS NULL
  )
);

CREATE POLICY "Users can view clients based on role and team" 
ON public.invoice_clients FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND
  (
    -- Admins see all clients
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Managers see their team's clients
    (team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid())) OR
    -- Allow viewing clients without team_id for backward compatibility
    team_id IS NULL
  )
);

CREATE POLICY "Users can update clients for their teams" 
ON public.invoice_clients FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  (
    -- Admins can update any client
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'superadmin') OR
    -- Managers can update their team's clients
    (team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid()))
  )
);