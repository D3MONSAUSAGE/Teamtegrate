
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";

type Branch = {
  id: string;
  name: string;
  location?: string | null;
  created_at: string;
};

type BudgetCategory = {
  name: string;
  percentage: number;
  amount: number;
};

type BranchBudget = {
  id: string;
  branch_id: string;
  period: string;
  total_budget: number;
  notes?: string | null;
  categories?: BudgetCategory[];
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
    categories: BudgetCategory[];
  }>({
    branch_id: "",
    period: "",
    total_budget: "",
    notes: "",
    categories: [],
  });

  // Category management
  const [newCategory, setNewCategory] = useState({ name: "", percentage: 0 });
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  
  // Fetch branches and budgets on mount
  useEffect(() => {
    fetchBranchesAndBudgets();
  }, []);

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

    // Parse the categories from JSON if they exist
    const processedBudgets = (budgetsData || []).map(budget => {
      try {
        const categories = budget.categories ? JSON.parse(budget.categories) : [];
        return { ...budget, categories };
      } catch (e) {
        return { ...budget, categories: [] };
      }
    });

    setBudgets(processedBudgets);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      branch_id: "",
      period: "",
      total_budget: "",
      notes: "",
      categories: [],
    });
    setNewCategory({ name: "", percentage: 0 });
    setEditingCategoryIndex(null);
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
      categories: budget.categories || [],
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

  const handleAddCategory = () => {
    if (!newCategory.name.trim() || newCategory.percentage <= 0) {
      toast.error("Please enter a valid category name and percentage");
      return;
    }

    const totalPercentage = form.categories.reduce((sum, cat) => sum + cat.percentage, 0) + newCategory.percentage;
    
    if (totalPercentage > 100) {
      toast.error("Total percentage cannot exceed 100%");
      return;
    }

    // Calculate the amount based on the percentage and total budget
    const totalBudget = parseFloat(form.total_budget) || 0;
    const amount = (totalBudget * newCategory.percentage) / 100;
    
    const updatedCategory = {
      ...newCategory,
      amount
    };

    if (editingCategoryIndex !== null) {
      // Update existing category
      const updatedCategories = [...form.categories];
      updatedCategories[editingCategoryIndex] = updatedCategory;
      setForm({ ...form, categories: updatedCategories });
      setEditingCategoryIndex(null);
    } else {
      // Add new category
      setForm({
        ...form, 
        categories: [...form.categories, updatedCategory]
      });
    }
    
    setNewCategory({ name: "", percentage: 0 });
  };

  const handleEditCategory = (index: number) => {
    const category = form.categories[index];
    setNewCategory({
      name: category.name,
      percentage: category.percentage
    });
    setEditingCategoryIndex(index);
  };

  const handleDeleteCategory = (index: number) => {
    const updatedCategories = [...form.categories];
    updatedCategories.splice(index, 1);
    setForm({ ...form, categories: updatedCategories });
  };

  const recalculateAmounts = (totalBudget: number) => {
    return form.categories.map(category => ({
      ...category,
      amount: (totalBudget * category.percentage) / 100
    }));
  };

  const handleTotalBudgetChange = (value: string) => {
    const totalBudget = parseFloat(value) || 0;
    const updatedCategories = recalculateAmounts(totalBudget);
    setForm({
      ...form,
      total_budget: value,
      categories: updatedCategories
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.branch_id || !form.period || !form.total_budget) {
      toast.error("Please fill in all required fields!");
      return;
    }

    // Calculate remaining percentage if categories don't sum to 100%
    const totalPercentage = form.categories.reduce((sum, cat) => sum + cat.percentage, 0);
    let categories = [...form.categories];
    
    if (totalPercentage < 100 && categories.length > 0) {
      const remainingCategory = {
        name: "Miscellaneous",
        percentage: 100 - totalPercentage,
        amount: (parseFloat(form.total_budget) * (100 - totalPercentage)) / 100
      };
      
      // Check if Misc category already exists
      const miscIndex = categories.findIndex(cat => cat.name === "Miscellaneous");
      if (miscIndex >= 0) {
        categories[miscIndex] = remainingCategory;
      } else {
        categories.push(remainingCategory);
      }
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
        .single();

      if (error) {
        toast.error("Error updating budget");
        return;
      }
      
      // Parse categories back for display
      data.categories = categories;
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
      
      // Parse categories back for display
      data.categories = categories;
      setBudgets([data, ...budgets]);
      toast.success("Budget created!");
    }
    setOpen(false);
    resetForm();
  };

  // Helper to filter/attach budgets to branches
  const getBudgetsForBranch = (branchId: string) =>
    budgets.filter((b) => b.branch_id === branchId);

  const calculateTotalPercentage = () => {
    return form.categories.reduce((sum, category) => sum + category.percentage, 0);
  };

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
                        <div key={budget.id} className="bg-muted/70 px-4 py-3 rounded">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div>
                              <span className="font-medium text-sm">{budget.period}</span>
                              <span className="ml-3 text-xs text-gray-500">
                                Budget: <span className="font-bold">${Number(budget.total_budget).toLocaleString()}</span>
                              </span>
                              <span className="ml-3 text-xs text-gray-500">
                                Last change: {format(new Date(budget.updated_at), 'yyyy-MM-dd')}
                              </span>
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
                          
                          {budget.categories && budget.categories.length > 0 && (
                            <div className="mt-3 border-t border-gray-200 pt-2">
                              <p className="text-xs font-medium text-gray-500 mb-1">Budget Categories</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {budget.categories.map((category, idx) => (
                                  <div key={idx} className="flex justify-between bg-background p-2 rounded text-xs">
                                    <span>{category.name}</span>
                                    <div className="flex gap-2">
                                      <span>${category.amount?.toLocaleString()}</span>
                                      <Badge variant="outline" className="text-xs h-5 px-1">
                                        {category.percentage}%
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {budget.notes && (
                            <div className="text-xs italic text-gray-400 mt-2">
                              Note: {budget.notes}
                            </div>
                          )}
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
        <DialogContent className="max-w-3xl">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onChange={(e) => handleTotalBudgetChange(e.target.value)}
                  required
                />
              </div>
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
            
            {/* Budget Categories Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Budget Categories</h4>
                <Badge variant={calculateTotalPercentage() === 100 ? "default" : "outline"}>
                  {calculateTotalPercentage()}% Allocated
                </Badge>
              </div>
              
              {/* Add/Edit Category Form */}
              <div className="flex gap-2 items-end">
                <div className="flex-grow">
                  <label className="text-xs font-medium mb-1 block">Category Name</label>
                  <Input
                    placeholder="E.g. Marketing, Operations"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs font-medium mb-1 block">Percentage</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    placeholder="%"
                    value={newCategory.percentage || ""}
                    onChange={(e) => setNewCategory({...newCategory, percentage: Number(e.target.value)})}
                  />
                </div>
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleAddCategory}
                  variant="outline"
                >
                  {editingCategoryIndex !== null ? 'Save' : 'Add'}
                </Button>
              </div>
              
              {/* Categories List */}
              {form.categories.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.categories.map((category, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell className="text-right">{category.percentage}%</TableCell>
                        <TableCell className="text-right">
                          ${(parseFloat(form.total_budget) * category.percentage / 100).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleEditCategory(idx)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleDeleteCategory(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-3 text-sm text-muted-foreground bg-muted/50 rounded-md">
                  No categories added yet
                </div>
              )}
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
