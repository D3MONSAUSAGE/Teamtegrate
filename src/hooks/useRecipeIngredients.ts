import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeIngredientsApi, RecipeIngredient } from '@/contexts/inventory/api/productionRecipes';
import { toast } from 'sonner';

const INGREDIENTS_QUERY_KEY = (recipeId: string) => ['recipe-ingredients', recipeId];

/**
 * Hook to fetch ingredients for a recipe
 */
export function useRecipeIngredients(recipeId: string) {
  return useQuery({
    queryKey: INGREDIENTS_QUERY_KEY(recipeId),
    queryFn: () => recipeIngredientsApi.getByRecipe(recipeId),
    enabled: !!recipeId,
  });
}

/**
 * Hook to add an ingredient to a recipe
 */
export function useAddIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recipeIngredientsApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_QUERY_KEY(variables.recipe_id) });
      queryClient.invalidateQueries({ queryKey: ['production-recipes'] });
      toast.success('Ingredient added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add ingredient: ${error.message}`);
    },
  });
}

/**
 * Hook to update an ingredient
 */
export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<RecipeIngredient> }) =>
      recipeIngredientsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['production-recipes'] });
      toast.success('Ingredient updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update ingredient: ${error.message}`);
    },
  });
}

/**
 * Hook to delete an ingredient
 */
export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recipeIngredientsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['production-recipes'] });
      toast.success('Ingredient removed successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove ingredient: ${error.message}`);
    },
  });
}
