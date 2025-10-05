-- Phase 1: Enhanced Invoice Financial Tracking Schema (Updated)

-- Add financial tracking columns to invoices table
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_total DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_due_date DATE,
  ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expense_category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS reference_number TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add constraint for payment_status if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invoices_payment_status_check'
  ) THEN
    ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_payment_status_check 
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'void'));
  END IF;
END $$;

-- Create invoice_line_items table
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on invoice_line_items
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view line items for accessible invoices" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Users can manage line items for their invoices" ON public.invoice_line_items;

-- RLS policies for invoice_line_items
CREATE POLICY "Users can view line items for accessible invoices" ON public.invoice_line_items
  FOR SELECT USING (
    organization_id = get_current_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.organization_id = get_current_user_organization_id()
    )
  );

CREATE POLICY "Users can manage line items for their invoices" ON public.invoice_line_items
  FOR ALL USING (
    organization_id = get_current_user_organization_id()
  )
  WITH CHECK (
    organization_id = get_current_user_organization_id()
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON public.invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_due_date ON public.invoices(payment_due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_expense_category_id ON public.invoices(expense_category_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON public.invoice_line_items(invoice_id);

-- Add comments
COMMENT ON TABLE public.invoice_line_items IS 'Detailed line items for invoices';
COMMENT ON COLUMN public.invoices.payment_status IS 'Payment status: unpaid, partial, paid, void';
COMMENT ON COLUMN public.invoices.invoice_total IS 'Total amount on the invoice';
COMMENT ON COLUMN public.invoices.paid_amount IS 'Amount already paid towards this invoice';