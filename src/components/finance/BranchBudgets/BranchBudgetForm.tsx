
import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BudgetCategoriesEditor, { BudgetCategory } from "./BudgetCategoriesEditor";

export type BranchBudgetFormState = {
  branch_id: string;
  period: string;
  total_budget: string;
  notes: string;
  categories: BudgetCategory[];
};

type Branch = {
  id: string;
  name: string;
};

type Props = {
  branches: Branch[];
  initialState: BranchBudgetFormState | null;
  editBudgetId: string | null;
  onCancel: () => void;
  onSave: (data: BranchBudgetFormState) => Promise<boolean | void>;
};

const defaultForm: BranchBudgetFormState = {
  branch_id: "",
  period: "",
  total_budget: "",
  notes: "",
  categories: [],
};

const BranchBudgetForm: React.FC<Props> = ({
  branches,
  initialState,
  editBudgetId,
  onCancel,
  onSave,
}) => {
  const [form, setForm] = useState<BranchBudgetFormState>(initialState || defaultForm);
  const [saving, setSaving] = useState(false);

  // When editing, branch cannot change
  const allowSelectBranch = !editBudgetId;

  // Handlers
  const handleChange = (field: keyof BranchBudgetFormState, value: string | BudgetCategory[]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // When total_budget changes, update category amounts
  const handleTotalBudgetChange = (val: string) => {
    const totalBudget = parseFloat(val) || 0;
    const updatedCategories = form.categories.map(category => ({
      ...category,
      amount: (totalBudget * category.percentage) / 100,
    }));
    setForm({
      ...form,
      total_budget: val,
      categories: updatedCategories,
    });
  };

  const calculateTotalPercentage = () =>
    form.categories.reduce((sum, c) => sum + c.percentage, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {allowSelectBranch && (
        <div>
          <label className="text-xs font-medium mb-1 block">Branch</label>
          <Select
            value={form.branch_id}
            onValueChange={(val) => handleChange("branch_id", val)}
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
            onChange={(e) => handleChange("period", e.target.value)}
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
          onChange={(e) => handleChange("notes", e.target.value)}
        />
      </div>

      {/* Categories management */}
      <BudgetCategoriesEditor
        totalBudget={parseFloat(form.total_budget) || 0}
        categories={form.categories}
        setCategories={(categories) => handleChange("categories", categories)}
      />
      {/* Allocated badge */}
      <div className="flex justify-end">
        <Badge variant={calculateTotalPercentage() === 100 ? "default" : "outline"}>
          {calculateTotalPercentage()}% Allocated
        </Badge>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : (editBudgetId ? "Save Changes" : "Create Budget")}</Button>
      </div>
    </form>
  );
};

export default BranchBudgetForm;
export type { BudgetCategory };
