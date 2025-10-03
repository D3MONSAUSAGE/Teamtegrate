-- Create expense categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'variable', 'one_time')),
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT,
  budget_amount DECIMAL(12,2),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  vendor_name TEXT,
  receipt_url TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other')),
  invoice_number TEXT,
  notes TEXT,
  tags TEXT[],
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  budget_type TEXT NOT NULL CHECK (budget_type IN ('monthly', 'quarterly', 'yearly')),
  amount DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  alert_threshold DECIMAL(5,2) DEFAULT 80.00, -- Alert at 80% of budget
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create P&L snapshots table for caching
CREATE TABLE IF NOT EXISTS public.profit_loss_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cogs DECIMAL(12,2) NOT NULL DEFAULT 0,
  gross_profit DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_operating_expenses DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_labor_costs DECIMAL(12,2) NOT NULL DEFAULT 0,
  operating_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  gross_margin_percent DECIMAL(5,2),
  operating_margin_percent DECIMAL(5,2),
  net_margin_percent DECIMAL(5,2),
  expense_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_loss_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
CREATE POLICY "Users can view categories in their org"
  ON public.expense_categories FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage categories"
  ON public.expense_categories FOR ALL
  USING (
    organization_id = get_current_user_organization_id() 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses in their org"
  ON public.expenses FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Users can create expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (
    organization_id = get_current_user_organization_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (
    organization_id = get_current_user_organization_id()
    AND user_id = auth.uid()
    AND status = 'pending'
  );

CREATE POLICY "Managers can manage all expenses"
  ON public.expenses FOR ALL
  USING (
    organization_id = get_current_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- RLS Policies for budgets
CREATE POLICY "Users can view budgets in their org"
  ON public.budgets FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "Managers can manage budgets"
  ON public.budgets FOR ALL
  USING (
    organization_id = get_current_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin', 'superadmin')
    )
  );

-- RLS Policies for P&L snapshots
CREATE POLICY "Users can view P&L in their org"
  ON public.profit_loss_snapshots FOR SELECT
  USING (organization_id = get_current_user_organization_id());

CREATE POLICY "System can create P&L snapshots"
  ON public.profit_loss_snapshots FOR INSERT
  WITH CHECK (organization_id = get_current_user_organization_id());

-- Create indexes
CREATE INDEX idx_expense_categories_org ON public.expense_categories(organization_id);
CREATE INDEX idx_expenses_org_date ON public.expenses(organization_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON public.expenses(category_id);
CREATE INDEX idx_expenses_user ON public.expenses(user_id);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_budgets_org ON public.budgets(organization_id);
CREATE INDEX idx_budgets_dates ON public.budgets(start_date, end_date);
CREATE INDEX idx_pl_snapshots_org_dates ON public.profit_loss_snapshots(organization_id, period_start, period_end);

-- Triggers for updated_at
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default expense categories
INSERT INTO public.expense_categories (organization_id, name, type, color, is_default) VALUES
  ((SELECT id FROM public.organizations LIMIT 1), 'Rent & Utilities', 'fixed', '#ef4444', true),
  ((SELECT id FROM public.organizations LIMIT 1), 'Payroll', 'fixed', '#f59e0b', true),
  ((SELECT id FROM public.organizations LIMIT 1), 'Food & Beverages (COGS)', 'variable', '#10b981', true),
  ((SELECT id FROM public.organizations LIMIT 1), 'Marketing & Advertising', 'variable', '#3b82f6', true),
  ((SELECT id FROM public.organizations LIMIT 1), 'Equipment & Supplies', 'variable', '#8b5cf6', true),
  ((SELECT id FROM public.organizations LIMIT 1), 'Maintenance & Repairs', 'variable', '#ec4899', true),
  ((SELECT id FROM public.organizations LIMIT 1), 'Professional Services', 'variable', '#6366f1', true),
  ((SELECT id FROM public.organizations LIMIT 1), 'Insurance', 'fixed', '#14b8a6', true),
  ((SELECT id FROM public.organizations LIMIT 1), 'Licenses & Permits', 'fixed', '#f97316', true),
  ((SELECT id FROM public.organizations LIMIT 1), 'Other Operating Expenses', 'variable', '#64748b', true);