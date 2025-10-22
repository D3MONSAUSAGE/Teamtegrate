import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, Plus } from "lucide-react";
import { useExpenseCategories, useCreateExpenseCategory } from '@/hooks/useExpenses';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ExpenseCategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const ExpenseCategorySelector: React.FC<ExpenseCategorySelectorProps> = ({
  value,
  onValueChange,
  disabled
}) => {
  const { data: categories, isLoading } = useExpenseCategories();
  const createCategory = useCreateExpenseCategory();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [newCategoryBudget, setNewCategoryBudget] = useState<string>('');

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    createCategory.mutate(
      {
        name: newCategoryName.trim(),
        type: newCategoryType,
        color: newCategoryColor,
        budget_amount: newCategoryBudget ? parseFloat(newCategoryBudget) : undefined,
      },
      {
        onSuccess: (data) => {
          onValueChange(data.id);
          setIsDialogOpen(false);
          setNewCategoryName('');
          setNewCategoryType('expense');
          setNewCategoryColor('#6366f1');
          setNewCategoryBudget('');
        },
      }
    );
  };

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
        <SelectTrigger className="flex-1 border-2">
          <SelectValue placeholder={isLoading ? "Loading categories..." : "Select expense category"} />
        </SelectTrigger>
        <SelectContent>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>{category.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="border-2"
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Expense Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Office Supplies"
                disabled={createCategory.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-type">Type *</Label>
              <Select
                value={newCategoryType}
                onValueChange={(val) => setNewCategoryType(val as 'income' | 'expense')}
                disabled={createCategory.isPending}
              >
                <SelectTrigger id="category-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-color">Color</Label>
              <Input
                id="category-color"
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                disabled={createCategory.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-budget">Budget Amount</Label>
              <Input
                id="category-budget"
                type="number"
                step="0.01"
                value={newCategoryBudget}
                onChange={(e) => setNewCategoryBudget(e.target.value)}
                placeholder="Optional"
                disabled={createCategory.isPending}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={createCategory.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={createCategory.isPending}
            >
              {createCategory.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
