import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { useRecipeCostCategories } from '@/hooks/useRecipeCostCategories';
import { useAddOtherCost } from '@/hooks/useRecipeOtherCosts';
import { ManageCostCategoriesDialog } from './ManageCostCategoriesDialog';

interface AddOtherCostDialogProps {
  recipeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddOtherCostDialog: React.FC<AddOtherCostDialogProps> = ({
  recipeId,
  open,
  onOpenChange,
}) => {
  const { data: categories = [] } = useRecipeCostCategories();
  const { mutate: addOtherCost, isPending } = useAddOtherCost();

  const [categoryId, setCategoryId] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showManageCategories, setShowManageCategories] = useState(false);

  const handleAdd = () => {
    if (!categoryId || !costAmount) return;

    addOtherCost(
      {
        recipe_id: recipeId,
        category_id: categoryId,
        cost_amount: parseFloat(costAmount),
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          // Reset form but keep dialog open
          setCategoryId('');
          setCostAmount('');
          setNotes('');
        },
      }
    );
  };

  const canAdd = categoryId && costAmount && parseFloat(costAmount) > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Other Cost</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category">Cost Category *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManageCategories(true)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Manage
                </Button>
              </div>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No categories. Click "Manage" to create one.
                    </div>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costAmount">Cost Amount *</Label>
              <Input
                id="costAmount"
                type="number"
                step="0.01"
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!canAdd || isPending}
                className="flex-1"
              >
                {isPending ? 'Adding...' : 'Add Cost'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ManageCostCategoriesDialog
        open={showManageCategories}
        onOpenChange={setShowManageCategories}
      />
    </>
  );
};
