import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RecipeWithCosts } from '@/hooks/useRecipes';

interface RecipeDetailsDialogProps {
  recipe: RecipeWithCosts;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecipeDetailsDialog: React.FC<RecipeDetailsDialogProps> = ({
  recipe,
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipe Info */}
          <div className="space-y-2">
            {recipe.description && (
              <p className="text-muted-foreground">{recipe.description}</p>
            )}
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Output: </span>
                <span className="font-medium">
                  {recipe.output_quantity} {recipe.output_unit}
                </span>
              </div>
            </div>
            {recipe.notes && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-1">Notes:</p>
                <p className="text-sm text-muted-foreground">{recipe.notes}</p>
              </div>
            )}
          </div>

          {/* Ingredients Table */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipe.ingredients.map((ingredient) => (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium">
                        {ingredient.item_name}
                        {ingredient.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {ingredient.notes}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {ingredient.quantity_needed}
                      </TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell className="text-right">
                        ${ingredient.unit_cost.toFixed(2)}
                        {ingredient.manual_unit_cost !== undefined && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (manual)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${ingredient.total_cost.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total Recipe Cost:</span>
              <span className="font-bold text-primary">
                ${recipe.total_cost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost Per Unit:</span>
              <span className="font-semibold">
                ${recipe.cost_per_unit.toFixed(2)}/{recipe.output_unit}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
