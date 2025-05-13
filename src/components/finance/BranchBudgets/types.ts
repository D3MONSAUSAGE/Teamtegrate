
export type BudgetCategory = {
  name: string;
  percentage: number;
  amount: number;
};

export type BranchBudgetFormState = {
  branch_id: string;
  period: string;
  total_budget: string;
  notes: string;
  categories: BudgetCategory[];
};

export type Branch = {
  id: string;
  name: string;
  location?: string | null;
  created_at: string;
};

export type BranchBudget = {
  id: string;
  branch_id: string;
  period: string;
  total_budget: number;
  notes?: string | null;
  categories?: BudgetCategory[];
  created_at: string;
  updated_at: string;
};
