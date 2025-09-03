export interface TransactionCategory {
  id: string;
  organization_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  organization_id: string;
  user_id: string;
  category_id: string;
  category?: TransactionCategory;
  type: 'income' | 'expense' | 'fixed_cost';
  amount: number;
  description: string;
  date: string;
  location?: string;
  team_id?: string;
  receipt_url?: string;
  vendor_name?: string;
  is_recurring: boolean;
  recurring_template_id?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: string;
  organization_id: string;
  user_id: string;
  category_id: string;
  category?: TransactionCategory;
  type: 'income' | 'expense' | 'fixed_cost';
  amount: number;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  location?: string;
  team_id?: string;
  vendor_name?: string;
  is_active: boolean;
  next_generation_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PettyCashBox {
  id: string;
  organization_id: string;
  name: string;
  location: string;
  initial_amount: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PettyCashTransaction {
  id: string;
  organization_id: string;
  petty_cash_box_id: string;
  petty_cash_box?: PettyCashBox;
  user_id: string;
  type: 'expense' | 'replenishment';
  amount: number;
  description: string;
  date: string;
  receipt_url?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  expensesByCategory: Array<{
    category_name: string;
    category_color: string;
    total: number;
  }>;
  incomeByCategory: Array<{
    category_name: string;
    category_color: string;
    total: number;
  }>;
}