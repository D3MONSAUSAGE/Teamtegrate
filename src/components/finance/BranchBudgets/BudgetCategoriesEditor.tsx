import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { BudgetCategory } from "./types";

type Props = {
  totalBudget: number;
  categories: BudgetCategory[];
  setCategories: (categories: BudgetCategory[]) => void;
};

const BudgetCategoriesEditor: React.FC<Props> = ({ totalBudget, categories, setCategories }) => {
  const [newCategory, setNewCategory] = useState<{name: string, percentage: number}>({ name: "", percentage: 0 });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddOrEdit = () => {
    if (!newCategory.name.trim() || newCategory.percentage <= 0) {
      toast.error("Please enter a valid category name and percentage");
      return;
    }
    const currentTotal = categories.reduce((sum, cat, idx) =>
      editingIndex !== null && idx === editingIndex
        ? sum // editing: skip old value
        : sum + cat.percentage, 0
    );
    const proposedTotal = currentTotal + newCategory.percentage;
    if (proposedTotal > 100) {
      toast.error("Total percentage cannot exceed 100%");
      return;
    }
    const amount = (totalBudget * newCategory.percentage) / 100;
    const updated = { ...newCategory, amount };
    let newCatArr;
    if (editingIndex !== null) {
      newCatArr = [...categories];
      newCatArr[editingIndex] = updated;
    } else {
      newCatArr = [...categories, updated];
    }
    setCategories(newCatArr);
    setNewCategory({ name: "", percentage: 0 });
    setEditingIndex(null);
  };

  const handleEditClick = (idx: number) => {
    setNewCategory({ name: categories[idx].name, percentage: categories[idx].percentage });
    setEditingIndex(idx);
  };
  const handleDelete = (idx: number) => {
    setCategories(categories.filter((_, i) => i !== idx));
    setNewCategory({ name: "", percentage: 0 });
    setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end">
        <div className="flex-grow">
          <label className="text-xs font-medium mb-1 block">Category Name</label>
          <Input
            placeholder="E.g. Marketing, Operations"
            value={newCategory.name}
            onChange={(e) => setNewCategory(n => ({ ...n, name: e.target.value }))}
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
            onChange={(e) => setNewCategory(n => ({ ...n, percentage: Number(e.target.value) }))}
          />
        </div>
        <Button type="button" size="sm" onClick={handleAddOrEdit} variant="outline">
          {editingIndex !== null ? "Save" : "Add"}
        </Button>
      </div>
      {categories.length > 0 ? (
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
            {categories.map((cat, idx) => (
              <TableRow key={idx}>
                <TableCell>{cat.name}</TableCell>
                <TableCell className="text-right">{cat.percentage}%</TableCell>
                <TableCell className="text-right">${cat.amount?.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEditClick(idx)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(idx)}>
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
  );
};

export default BudgetCategoriesEditor;
