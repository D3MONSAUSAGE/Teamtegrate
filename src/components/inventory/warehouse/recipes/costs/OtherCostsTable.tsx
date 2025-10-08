import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useRecipeOtherCosts, useDeleteOtherCost } from '@/hooks/useRecipeOtherCosts';

interface OtherCostsTableProps {
  recipeId: string;
}

export const OtherCostsTable: React.FC<OtherCostsTableProps> = ({ recipeId }) => {
  const { data: otherCosts = [], isLoading } = useRecipeOtherCosts(recipeId);
  const { mutate: deleteOtherCost } = useDeleteOtherCost();

  const handleDelete = (costId: string, categoryName: string) => {
    if (confirm(`Delete ${categoryName} cost?`)) {
      deleteOtherCost({ id: costId, recipeId });
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading other costs...</div>;
  }

  if (otherCosts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No other costs added yet</p>
      </div>
    );
  }

  const totalOtherCosts = otherCosts.reduce((sum, cost) => sum + cost.cost_amount, 0);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Cost Amount</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {otherCosts.map((cost) => (
            <TableRow key={cost.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{cost.category_name}</p>
                  {cost.category_description && (
                    <p className="text-xs text-muted-foreground">{cost.category_description}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">${cost.cost_amount.toFixed(2)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{cost.notes || '-'}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cost.id, cost.category_name || 'this')}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50 font-medium">
            <TableCell>Total Other Costs</TableCell>
            <TableCell className="text-lg">${totalOtherCosts.toFixed(2)}</TableCell>
            <TableCell colSpan={2}></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
