-- Create payment types table for customizable payment methods
CREATE TABLE IF NOT EXISTS public.payment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_cash_equivalent BOOLEAN NOT NULL DEFAULT false, -- Track if this payment type should be counted as cash on hand
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Add RLS policies for payment_types
ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment types in their organization"
  ON public.payment_types FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage payment types"
  ON public.payment_types FOR ALL
  USING (
    organization_id = get_current_user_organization_id() 
    AND get_current_user_role() IN ('manager', 'admin', 'superadmin')
  );

-- Add payment tracking columns to created_invoices table
ALTER TABLE public.created_invoices 
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED;

-- Update existing payment_records table to use custom payment types
ALTER TABLE public.payment_records 
  ADD COLUMN IF NOT EXISTS payment_type_id UUID REFERENCES public.payment_types(id),
  ADD COLUMN IF NOT EXISTS is_cash_payment BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_created_invoices_payment_status ON public.created_invoices(payment_status, organization_id);
CREATE INDEX IF NOT EXISTS idx_created_invoices_issue_date ON public.created_invoices(issue_date DESC, organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_date ON public.payment_records(payment_date DESC, organization_id);

-- Create a view for weekly sales summary
CREATE OR REPLACE VIEW public.weekly_sales_summary AS
SELECT 
  i.organization_id,
  i.warehouse_id,
  i.team_id,
  DATE_TRUNC('week', i.issue_date) AS week_start,
  DATE_TRUNC('week', i.issue_date) + INTERVAL '6 days' AS week_end,
  COUNT(i.id) AS total_invoices,
  SUM(i.total_amount) AS total_sales,
  SUM(i.paid_amount) AS total_collected,
  SUM(i.balance_due) AS total_outstanding,
  SUM(CASE WHEN i.payment_status = 'paid' THEN i.total_amount ELSE 0 END) AS paid_invoices_total,
  SUM(CASE WHEN i.payment_status = 'pending' THEN i.total_amount ELSE 0 END) AS pending_invoices_total,
  SUM(CASE WHEN i.payment_status = 'overdue' THEN i.total_amount ELSE 0 END) AS overdue_invoices_total,
  COUNT(CASE WHEN i.payment_status = 'paid' THEN 1 END) AS paid_count,
  COUNT(CASE WHEN i.payment_status = 'pending' THEN 1 END) AS pending_count,
  COUNT(CASE WHEN i.payment_status = 'overdue' THEN 1 END) AS overdue_count
FROM public.created_invoices i
GROUP BY i.organization_id, i.warehouse_id, i.team_id, DATE_TRUNC('week', i.issue_date);

-- Create a view for cash on hand tracking
CREATE OR REPLACE VIEW public.cash_on_hand_summary AS
SELECT 
  pr.organization_id,
  ci.warehouse_id,
  ci.team_id,
  DATE_TRUNC('week', pr.payment_date) AS week_start,
  DATE_TRUNC('week', pr.payment_date) + INTERVAL '6 days' AS week_end,
  SUM(CASE WHEN pr.is_cash_payment OR pt.is_cash_equivalent THEN pr.amount ELSE 0 END) AS cash_collected,
  SUM(pr.amount) AS total_collected,
  COUNT(*) AS payment_count,
  ARRAY_AGG(DISTINCT COALESCE(pt.name, pr.payment_method)) AS payment_methods_used
FROM public.payment_records pr
LEFT JOIN public.created_invoices ci ON pr.invoice_id = ci.id
LEFT JOIN public.payment_types pt ON pr.payment_type_id = pt.id
GROUP BY pr.organization_id, ci.warehouse_id, ci.team_id, DATE_TRUNC('week', pr.payment_date);

-- Insert default payment types for all organizations
INSERT INTO public.payment_types (organization_id, name, description, is_cash_equivalent, created_by)
SELECT DISTINCT 
  u.organization_id,
  payment_type.name,
  payment_type.description,
  payment_type.is_cash,
  (SELECT id FROM public.users WHERE organization_id = u.organization_id AND role IN ('admin', 'superadmin') LIMIT 1)
FROM public.users u
CROSS JOIN (
  VALUES 
    ('Cash', 'Cash payment', true),
    ('Check', 'Check payment', false),
    ('Zelle', 'Zelle transfer', false),
    ('Wire Transfer', 'Bank wire transfer', false),
    ('Credit Card', 'Credit card payment', false),
    ('Debit Card', 'Debit card payment', false)
) AS payment_type(name, description, is_cash)
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_types pt 
  WHERE pt.organization_id = u.organization_id 
  AND pt.name = payment_type.name
)
ON CONFLICT (organization_id, name) DO NOTHING;

-- Function to automatically update payment status when payments are recorded
CREATE OR REPLACE FUNCTION public.update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total NUMERIC;
  total_paid NUMERIC;
BEGIN
  -- Get invoice total
  SELECT total_amount INTO invoice_total
  FROM public.created_invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payment_records
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Update invoice payment status and paid amount
  UPDATE public.created_invoices
  SET 
    paid_amount = total_paid,
    payment_status = CASE
      WHEN total_paid = 0 THEN 'pending'
      WHEN total_paid >= invoice_total THEN 'paid'
      WHEN total_paid < invoice_total THEN 'partial'
      ELSE payment_status
    END,
    paid_at = CASE 
      WHEN total_paid >= invoice_total AND paid_at IS NULL THEN now()
      ELSE paid_at
    END
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic payment status updates
DROP TRIGGER IF EXISTS update_payment_status_on_payment ON public.payment_records;
CREATE TRIGGER update_payment_status_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_payment_status();

-- Function to automatically mark invoices as overdue
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE public.created_invoices
  SET payment_status = 'overdue'
  WHERE payment_status IN ('pending', 'partial')
    AND due_date < CURRENT_DATE
    AND balance_due > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;