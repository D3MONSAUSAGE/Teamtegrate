import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Package } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRecipeIngredients, useDeleteIngredient } from '@/hooks/useRecipeIngredients';
import { useInventory } from '@/contexts/inventory';
import { parsePackagingInfo, calculateDisplayQuantity, formatQuantity } from '@/utils/recipeUnitHelpers';

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
    <TooltipProvider>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Packaging</TableHead>
              <TableHead className="text-right">Cost/Unit</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.map((ingredient) => {
              const unitCost = ingredient.manual_unit_cost || ingredient.cost_per_base_unit || 0;
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
                    {(() => {
                      const packaging = parsePackagingInfo(ingredient.packaging_info);
                      const displayQty = calculateDisplayQuantity(
                        ingredient.quantity_needed,
                        ingredient.conversion_factor_snapshot,
                        packaging
                      );
                      
                      return (
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            {formatQuantity(displayQty.quantity)} {displayQty.unit}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({ingredient.quantity_needed} {ingredient.unit})
                          </span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {ingredient.packaging_info ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                            <Package className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{ingredient.packaging_info}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1 text-xs">
                            <p><strong>Original Packaging:</strong> {ingredient.packaging_info}</p>
                            {ingredient.purchase_price_snapshot && (
                              <p><strong>Price at Creation:</strong> ${ingredient.purchase_price_snapshot.toFixed(2)}</p>
                            )}
                            {ingredient.conversion_factor_snapshot && (
                              <p><strong>Conversion Factor:</strong> {ingredient.conversion_factor_snapshot}</p>
                            )}
                            <p><strong>Base Unit:</strong> {ingredient.base_unit || ingredient.unit}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    ${unitCost.toFixed(4)}/{ingredient.unit}
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
    </TooltipProvider>
  );
};
