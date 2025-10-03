export interface ExpenseCategory {
  id: string;
  organization_id: string;
  name: string;
  type: 'fixed' | 'variable' | 'one_time';
  color: string;
  icon?: string;
  budget_amount?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  category_id: string;
  category?: ExpenseCategory;
  user_id: string;
  team_id?: string;
  amount: number;
  description: string;
  expense_date: string;
  vendor_name?: string;
  receipt_url?: string;
  payment_method?: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'other';
  invoice_number?: string;
  notes?: string;
  tags?: string[];
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  organization_id: string;
  category_id?: string;
  category?: ExpenseCategory;
  team_id?: string;
  budget_type: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  start_date: string;
  end_date: string;
  alert_threshold: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProfitLossSnapshot {
  id: string;
  organization_id: string;
  team_id?: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  total_operating_expenses: number;
  total_labor_costs: number;
  operating_income: number;
  net_income: number;
  gross_margin_percent?: number;
  operating_margin_percent?: number;
  net_margin_percent?: number;
  expense_breakdown: Record<string, number>;
  created_at: string;
}

export interface ProfitLossData {
  period: { start: string; end: string };
  revenue: {
    grossSales: number;
    netSales: number;
  };
  cogs: {
    total: number;
    byCategory: Array<{ category: string; amount: number }>;
  };
  grossProfit: {
    amount: number;
    margin: number;
  };
  operatingExpenses: {
    total: number;
    byCategory: Array<{ category: string; amount: number; type: string }>;
  };
  laborCosts: {
    total: number;
    percentage: number;
  };
  operatingIncome: {
    amount: number;
    margin: number;
  };
  netIncome: {
    amount: number;
    margin: number;
  };
  primeCost: {
    amount: number;
    percentage: number;
  };
}
