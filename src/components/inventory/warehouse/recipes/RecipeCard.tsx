import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Copy, Trash2, Edit } from 'lucide-react';
import { RecipeWithCosts } from '@/hooks/useRecipes';
import { useDeleteRecipe, useDuplicateRecipe } from '@/hooks/useRecipes';
import { RecipeDetailsDialog } from './RecipeDetailsDialog';
import { EditRecipeDialog } from './EditRecipeDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RecipeCardProps {
  recipe: RecipeWithCosts;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { mutate: deleteRecipe, isPending: isDeleting } = useDeleteRecipe();
  const { mutate: duplicateRecipe, isPending: isDuplicating } = useDuplicateRecipe();

  const handleDelete = () => {
    deleteRecipe(recipe.id, {
      onSuccess: () => setDeleteDialogOpen(false),
    });
  };

  const handleDuplicate = () => {
    duplicateRecipe(recipe.id);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">{recipe.name}</CardTitle>
          {recipe.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Output:</span>
              <span className="font-medium">
                {recipe.output_quantity} {recipe.output_unit}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ingredients:</span>
              <span className="font-medium">{recipe.ingredients.length}</span>
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Cost:</span>
              <span className="text-lg font-bold text-primary">
                ${recipe.total_cost.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cost Per Unit:</span>
              <span className="font-semibold">
                ${recipe.cost_per_unit.toFixed(2)}/{recipe.output_unit}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDetailsOpen(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={isDuplicating}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <RecipeDetailsDialog
        recipe={recipe}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <EditRecipeDialog
        recipe={recipe}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipe.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
