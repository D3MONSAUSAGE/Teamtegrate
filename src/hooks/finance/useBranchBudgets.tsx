
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { BranchBudgetFormState, BudgetCategory } from "@/components/finance/BranchBudgets/types";

// Types for branches and budgets
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

export const useBranchBudgets = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [budgets, setBudgets] = useState<BranchBudget[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);
  const [formDefault, setFormDefault] = useState<BranchBudgetFormState | null>(null);

  // Fetch branches and budgets
  const fetchBranchesAndBudgets = async () => {
    setLoading(true);

    const { data: branchData } = await supabase.from("branches").select("*").order("name", { ascending: true });
    setBranches(branchData || []);

    const { data: budgetsData } = await supabase.from("branch_budgets").select("*").order("updated_at", { ascending: false });

    // Parse categories from JSON
    const processedBudgets = (budgetsData || []).map(budget => {
      let categories = [];
      if ((budget as any).categories) {
        try { categories = JSON.parse((budget as any).categories); } catch {}
      }
      return { ...budget, categories };
    });

    setBudgets(processedBudgets as BranchBudget[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBranchesAndBudgets();
  }, []);

  // Modal open for new or edit
  const handleOpenNew = () => {
    setEditBudgetId(null);
    setFormDefault(null);
    setOpen(true);
  };

  const handleEdit = (budget: BranchBudget) => {
    setFormDefault({
      branch_id: budget.branch_id,
      period: budget.period,
      total_budget: String(budget.total_budget ?? ""),
      notes: budget.notes ?? "",
      categories: budget.categories || [],
    });
    setEditBudgetId(budget.id);
    setOpen(true);
  };

  const handleDelete = async (budget: BranchBudget) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;
    const { error } = await supabase.from("branch_budgets").delete().eq("id", budget.id);
    if (error) {
      toast.error("Error deleting budget");
      return;
    }
    setBudgets(budgets.filter((b) => b.id !== budget.id));
    toast.success("Budget deleted");
  };

  // Save (add or edit) handler, called from form
  const handleSave = async (form: BranchBudgetFormState) => {
    if (!form.branch_id || !form.period || !form.total_budget) {
      toast.error("Please fill in all required fields!");
      return false;
    }

    // Calculate remaining percentage if categories don't sum to 100%
    const totalPercentage = form.categories.reduce((sum, cat) => sum + cat.percentage, 0);
    let categories = [...form.categories];

    if (totalPercentage < 100 && categories.length > 0) {
      const remainingCategory = {
        name: "Miscellaneous",
        percentage: 100 - totalPercentage,
        amount: (parseFloat(form.total_budget) * (100 - totalPercentage)) / 100,
      };
      const miscIndex = categories.findIndex(cat => cat.name === "Miscellaneous");
      if (miscIndex >= 0) categories[miscIndex] = remainingCategory;
      else categories.push(remainingCategory);
    }

    const payload = {
      branch_id: form.branch_id,
      period: form.period.trim(),
      total_budget: Number(form.total_budget),
      notes: form.notes.trim() || null,
      categories: JSON.stringify(categories)
    };

    if (editBudgetId) {
      // Update
      const { data, error } = await supabase
        .from("branch_budgets")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editBudgetId)
        .select()
        .maybeSingle();

      if (error) {
        toast.error("Error updating budget");
        return false;
      }

      // Parse categories back for display
      const patched = { ...data, categories } as BranchBudget;
      setBudgets(
        budgets.map((b) => (b.id === editBudgetId ? patched : b))
      );
      toast.success("Budget updated.");
    } else {
      // Create
      const { data, error } = await supabase
        .from("branch_budgets")
        .insert([{ ...payload }])
        .select()
        .maybeSingle();

      if (error) {
        toast.error("Error creating budget");
        return false;
      }
      const patched = { ...(data as any), categories };
      setBudgets([patched, ...budgets]);
      toast.success("Budget created!");
    }
    setOpen(false);
    setEditBudgetId(null);
    setFormDefault(null);
    return true;
  };

  // Filter budgets for a branch
  const getBudgetsForBranch = (branchId: string) =>
    budgets.filter((b) => b.branch_id === branchId);

  return {
    branches,
    budgets,
    loading,
    open,
    setOpen,
    editBudgetId,
    formDefault,
    handleOpenNew,
    handleEdit,
    handleDelete,
    handleSave,
    getBudgetsForBranch
  };
};
