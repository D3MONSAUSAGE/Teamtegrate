
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type Branch = {
  id: string;
  name: string;
  location?: string | null;
  created_at: string;
};

type BranchBudget = {
  id: string;
  branch_id: string;
  period: string;
  total_budget: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

const BranchBudgets: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [budgets, setBudgets] = useState<BranchBudget[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<{
    branch_id: string;
    period: string;
    total_budget: string;
    notes: string;
  }>({
    branch_id: "",
    period: "",
    total_budget: "",
    notes: "",
  });

  // Fetch branches and budgets on mount
  useEffect(() => {
    const fetchBranchesAndBudgets = async () => {
      setLoading(true);

      const { data: branchData } = await supabase
        .from("branches")
        .select("*")
        .order("name", { ascending: true });

      setBranches(branchData || []);

      const { data: budgetsData } = await supabase
        .from("branch_budgets")
        .select("*")
        .order("updated_at", { ascending: false });

      setBudgets(budgetsData || []);
      setLoading(false);
    };
    fetchBranchesAndBudgets();
  }, []);

  const resetForm = () => {
    setForm({
      branch_id: "",
      period: "",
      total_budget: "",
      notes: "",
    });
    setEditBudgetId(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (budget: BranchBudget) => {
    setForm({
      branch_id: budget.branch_id,
      period: budget.period,
      total_budget: String(budget.total_budget ?? ""),
      notes: budget.notes ?? "",
    });
    setEditBudgetId(budget.id);
    setOpen(true);
  };

  const handleDelete = async (budget: BranchBudget) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    const { error } = await supabase
      .from("branch_budgets")
      .delete()
      .eq("id", budget.id);

    if (error) {
      toast.error("Error deleting budget");
      return;
    }
    setBudgets(budgets.filter((b) => b.id !== budget.id));
    toast.success("Budget deleted");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.branch_id || !form.period || !form.total_budget) {
      toast.error("Please fill in all required fields!");
      return;
    }

    const payload = {
      branch_id: form.branch_id,
      period: form.period.trim(),
      total_budget: Number(form.total_budget),
      notes: form.notes.trim() || null,
    };

    if (editBudgetId) {
      // Update
      const { data, error } = await supabase
        .from("branch_budgets")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editBudgetId)
        .select()
        .single();

      if (error) {
        toast.error("Error updating budget");
        return;
      }
      setBudgets(
        budgets.map((b) => (b.id === editBudgetId ? data : b))
      );
      toast.success("Budget updated.");
    } else {
      // Create new
      const { data, error } = await supabase
        .from("branch_budgets")
        .insert([{ ...payload }])
        .select()
        .single();

      if (error) {
        toast.error("Error creating budget");
        return;
      }
      setBudgets([data, ...budgets]);
      toast.success("Budget created!");
    }
    setOpen(false);
    resetForm();
  };

  // Helper to filter/attach budgets to branches
  const getBudgetsForBranch = (branchId: string) =>
    budgets.filter((b) => b.branch_id === branchId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-4">
        <h3 className="text-lg font-bold">Branch Budgets</h3>
        <Button size="sm" onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Budget
        </Button>
      </div>
      {loading ? (
        <div className="text-muted-foreground text-center py-12">Loading...</div>
      ) : branches.length === 0 ? (
        <Card>
          <CardContent className="py-10 flex-col items-center flex justify-center">
            <div className="text-gray-800 font-medium text-center mb-1">
              You don't have any branches yet.
            </div>
            <div className="text-muted-foreground mb-2 text-center">
              Please create a branch first to set budgets.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {branches.map((branch) => (
            <Card key={branch.id} className="shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="font-semibold">{branch.name}</span>
                  {branch.location && (
                    <Badge variant="secondary">{branch.location}</Badge>
                  )}
                </CardTitle>
                <div className="text-xs text-gray-500 mt-1">
                  Branch ID: <span className="select-all">{branch.id}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {getBudgetsForBranch(branch.id).length === 0 ? (
                    <div className="text-muted-foreground text-sm mb-4">
                      No budget set for this branch yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      {getBudgetsForBranch(branch.id).map((budget) => (
                        <div key={budget.id} className="bg-muted/70 px-4 py-3 rounded flex items-center justify-between gap-2">
                          <div>
                            <span className="font-medium text-sm">{budget.period}</span>
                            <span className="ml-3 text-xs text-gray-500">
                              Budget: <span className="font-bold">${Number(budget.total_budget).toLocaleString()}</span>
                            </span>
                            <span className="ml-3 text-xs text-gray-500">
                              Last change: {format(new Date(budget.updated_at), 'yyyy-MM-dd')}
                            </span>
                            {budget.notes && (
                              <span className="ml-4 text-xs italic text-gray-400">
                                {budget.notes}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="icon" variant="outline" onClick={() => handleEdit(budget)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="destructive" onClick={() => handleDelete(budget)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Budget Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editBudgetId ? "Edit Budget" : "Add Budget"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Branch Select only for NEW budget */}
            {!editBudgetId && (
              <div>
                <label className="text-xs font-medium mb-1 block">Branch</label>
                <Select
                  value={form.branch_id}
                  onValueChange={(val) => setForm((f) => ({ ...f, branch_id: val }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium mb-1 block">Period</label>
              <Input
                placeholder="E.g. 2025-Q3 or 2025"
                value={form.period}
                onChange={(e) =>
                  setForm((f) => ({ ...f, period: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Total Budget (USD)</label>
              <Input
                type="number"
                min={0}
                placeholder="Amount"
                value={form.total_budget}
                onChange={(e) =>
                  setForm((f) => ({ ...f, total_budget: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Notes</label>
              <Textarea
                placeholder="Optional notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editBudgetId ? "Save Changes" : "Create Budget"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchBudgets;

