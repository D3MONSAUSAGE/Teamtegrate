import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useRecipeIngredients, useDeleteIngredient } from '@/hooks/useRecipeIngredients';
import { useInventory } from '@/contexts/inventory';

interface IngredientsTableProps {
  recipeId: string;
}

export const IngredientsTable: React.FC<IngredientsTableProps> = ({ recipeId }) => {
  const { data: ingredients, isLoading } = useRecipeIngredients(recipeId);
  const { items } = useInventory();
  const { mutate: deleteIngredient } = useDeleteIngredient();

  if (isLoading) {
    return <p className="text-muted-foreground text-center py-4">Loading ingredients...</p>;
  }

  if (!ingredients || ingredients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No ingredients added yet.</p>
        <p className="text-sm mt-2">Click "Add Ingredient" to get started.</p>
      </div>
    );
  }

  const getItemName = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item?.name || 'Unknown Item';
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Unit Cost</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ingredients.map((ingredient) => {
            const unitCost = ingredient.manual_unit_cost || 0;
            const total = ingredient.quantity_needed * unitCost;

            return (
              <TableRow key={ingredient.id}>
                <TableCell className="font-medium">
                  {getItemName(ingredient.item_id)}
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
                  ${unitCost.toFixed(2)}
                  {ingredient.manual_unit_cost && (
                    <span className="text-xs text-muted-foreground ml-1">(manual)</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteIngredient(ingredient.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
