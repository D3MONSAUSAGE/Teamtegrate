-- Create invoice clients table
CREATE TABLE public.invoice_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'United States',
  tax_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice templates table
CREATE TABLE public.invoice_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_payment_terms TEXT DEFAULT 'Net 30',
  default_tax_rate NUMERIC DEFAULT 0,
  footer_text TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create created invoices table (to distinguish from uploaded invoice management)
CREATE TABLE public.created_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  client_id UUID NOT NULL,
  template_id UUID,
  created_by UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_terms TEXT DEFAULT 'Net 30',
  notes TEXT,
  footer_text TEXT,
  stripe_invoice_id TEXT, -- For Stripe integration
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_created_invoices_client FOREIGN KEY (client_id) REFERENCES public.invoice_clients(id) ON DELETE RESTRICT,
  CONSTRAINT fk_created_invoices_template FOREIGN KEY (template_id) REFERENCES public.invoice_templates(id) ON DELETE SET NULL
);

-- Create invoice line items table
CREATE TABLE public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_invoice_line_items_invoice FOREIGN KEY (invoice_id) REFERENCES public.created_invoices(id) ON DELETE CASCADE
);

-- Create payment records table
CREATE TABLE public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'other' CHECK (payment_method IN ('stripe', 'wire_transfer', 'check', 'cash', 'other')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_number TEXT,
  stripe_payment_id TEXT, -- For Stripe payments
  notes TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_payment_records_invoice FOREIGN KEY (invoice_id) REFERENCES public.created_invoices(id) ON DELETE CASCADE
);

-- Create organization payment settings table
CREATE TABLE public.organization_payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE,
  stripe_account_id TEXT,
  stripe_publishable_key TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_routing_number TEXT,
  bank_name TEXT,
  bank_address TEXT,
  default_payment_terms TEXT DEFAULT 'Net 30',
  default_tax_rate NUMERIC DEFAULT 0,
  invoice_footer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invoice_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.created_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_payment_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoice_clients
CREATE POLICY "Users can view clients in their organization" 
ON public.invoice_clients FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create clients" 
ON public.invoice_clients FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND 
  created_by = auth.uid() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

CREATE POLICY "Managers can update clients" 
ON public.invoice_clients FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

CREATE POLICY "Admins can delete clients" 
ON public.invoice_clients FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Create RLS policies for invoice_templates
CREATE POLICY "Users can view templates in their organization" 
ON public.invoice_templates FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage templates" 
ON public.invoice_templates FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
)
WITH CHECK (
  organization_id = get_current_user_organization_id() AND
  created_by = auth.uid() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

-- Create RLS policies for created_invoices
CREATE POLICY "Users can view invoices in their organization" 
ON public.created_invoices FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can create invoices" 
ON public.created_invoices FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND 
  created_by = auth.uid() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

CREATE POLICY "Managers can update invoices" 
ON public.created_invoices FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

CREATE POLICY "Admins can delete invoices" 
ON public.created_invoices FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Create RLS policies for invoice_line_items
CREATE POLICY "Users can view line items for organization invoices" 
ON public.invoice_line_items FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage line items" 
ON public.invoice_line_items FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
)
WITH CHECK (organization_id = get_current_user_organization_id());

-- Create RLS policies for payment_records
CREATE POLICY "Users can view payment records in their organization" 
ON public.payment_records FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can record payments" 
ON public.payment_records FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND 
  recorded_by = auth.uid() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

CREATE POLICY "Managers can update payment records" 
ON public.payment_records FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin', 'superadmin'))
);

-- Create RLS policies for organization_payment_settings
CREATE POLICY "Admins can view payment settings" 
ON public.organization_payment_settings FOR SELECT 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

CREATE POLICY "Admins can manage payment settings" 
ON public.organization_payment_settings FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
)
WITH CHECK (organization_id = get_current_user_organization_id());

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_invoice_clients_updated_at
  BEFORE UPDATE ON public.invoice_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_templates_updated_at
  BEFORE UPDATE ON public.invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_created_invoices_updated_at
  BEFORE UPDATE ON public.created_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON public.organization_payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  invoice_number TEXT;
BEGIN
  -- Get the next invoice number for this organization
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.created_invoices
  WHERE organization_id = org_id
  AND invoice_number ~ '^INV-[0-9]{4}-[0-9]+$';
  
  -- Generate invoice number in format INV-YYYY-####
  invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$;