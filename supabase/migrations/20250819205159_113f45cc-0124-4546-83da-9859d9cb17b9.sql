-- Create transaction categories table
CREATE TABLE public.transaction_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT DEFAULT '#3b82f6',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.transaction_categories(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'fixed_cost')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  receipt_url TEXT,
  vendor_name TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_template_id UUID,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recurring transactions table
CREATE TABLE public.recurring_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.transaction_categories(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'fixed_cost')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  location TEXT,
  vendor_name TEXT,
  is_active BOOLEAN DEFAULT true,
  next_generation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create petty cash boxes table
CREATE TABLE public.petty_cash_boxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  initial_amount NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create petty cash transactions table
CREATE TABLE public.petty_cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  petty_cash_box_id UUID NOT NULL REFERENCES public.petty_cash_boxes(id),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'replenishment')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  receipt_url TEXT,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transaction_categories
CREATE POLICY "Users can view categories in their organization" 
ON public.transaction_categories 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Admins can manage categories" 
ON public.transaction_categories 
FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager'))
);

-- Create RLS policies for transactions
CREATE POLICY "Users can view transactions in their organization" 
ON public.transactions 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND 
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own transactions or admins can update all" 
ON public.transactions 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND 
  (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')))
);

CREATE POLICY "Users can delete their own transactions or admins can delete all" 
ON public.transactions 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() AND 
  (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')))
);

-- Create RLS policies for recurring_transactions
CREATE POLICY "Users can view recurring transactions in their organization" 
ON public.recurring_transactions 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create recurring transactions" 
ON public.recurring_transactions 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND 
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own recurring transactions or admins can update all" 
ON public.recurring_transactions 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND 
  (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')))
);

CREATE POLICY "Users can delete their own recurring transactions or admins can delete all" 
ON public.recurring_transactions 
FOR DELETE 
USING (
  organization_id = get_current_user_organization_id() AND 
  (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')))
);

-- Create RLS policies for petty_cash_boxes
CREATE POLICY "Users can view petty cash boxes in their organization" 
ON public.petty_cash_boxes 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage petty cash boxes" 
ON public.petty_cash_boxes 
FOR ALL 
USING (
  organization_id = get_current_user_organization_id() AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager'))
);

-- Create RLS policies for petty_cash_transactions
CREATE POLICY "Users can view petty cash transactions in their organization" 
ON public.petty_cash_transactions 
FOR SELECT 
USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create petty cash transactions" 
ON public.petty_cash_transactions 
FOR INSERT 
WITH CHECK (
  organization_id = get_current_user_organization_id() AND 
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own petty cash transactions or admins can update all" 
ON public.petty_cash_transactions 
FOR UPDATE 
USING (
  organization_id = get_current_user_organization_id() AND 
  (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'manager')))
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_org_date ON public.transactions(organization_id, date);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_recurring_transactions_next_gen ON public.recurring_transactions(next_generation_date) WHERE is_active = true;
CREATE INDEX idx_petty_cash_transactions_box ON public.petty_cash_transactions(petty_cash_box_id);

-- Create triggers for updated_at
CREATE TRIGGER update_transaction_categories_updated_at
  BEFORE UPDATE ON public.transaction_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_transactions_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_petty_cash_boxes_updated_at
  BEFORE UPDATE ON public.petty_cash_boxes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_petty_cash_transactions_updated_at
  BEFORE UPDATE ON public.petty_cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default transaction categories
INSERT INTO public.transaction_categories (organization_id, name, type, color, is_default) VALUES
(get_current_user_organization_id(), 'Sales Revenue', 'income', '#10b981', true),
(get_current_user_organization_id(), 'Other Income', 'income', '#059669', true),
(get_current_user_organization_id(), 'Food Costs', 'expense', '#ef4444', true),
(get_current_user_organization_id(), 'Labor Costs', 'expense', '#f97316', true),
(get_current_user_organization_id(), 'Rent', 'expense', '#8b5cf6', true),
(get_current_user_organization_id(), 'Utilities', 'expense', '#06b6d4', true),
(get_current_user_organization_id(), 'Marketing', 'expense', '#ec4899', true),
(get_current_user_organization_id(), 'Supplies', 'expense', '#84cc16', true),
(get_current_user_organization_id(), 'Insurance', 'expense', '#6366f1', true),
(get_current_user_organization_id(), 'Maintenance', 'expense', '#f59e0b', true);