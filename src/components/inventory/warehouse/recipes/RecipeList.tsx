import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChefHat, DollarSign, Package } from 'lucide-react';
import { useRecipes } from '@/hooks/useRecipes';
import { RecipeCard } from './RecipeCard';
import { CreateRecipeDialog } from './CreateRecipeDialog';

export const RecipeList: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: recipes, isLoading } = useRecipes();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading recipes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Recipe Cost Calculator</h2>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Recipe
        </Button>
      </div>

      {!recipes || recipes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recipes Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Create your first recipe to track production costs and calculate pricing for your products.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Recipe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      <CreateRecipeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
};
