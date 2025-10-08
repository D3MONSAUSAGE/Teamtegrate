import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeOtherCostsApi, RecipeOtherCost } from '@/contexts/inventory/api/recipeOtherCosts';
import { toast } from 'sonner';

export const useRecipeOtherCosts = (recipeId: string) => {
  return useQuery({
    queryKey: ['recipe-other-costs', recipeId],
    queryFn: () => recipeOtherCostsApi.getByRecipe(recipeId),
    enabled: !!recipeId,
  });
};

export const useAddOtherCost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cost: Omit<RecipeOtherCost, 'id' | 'created_at'>) =>
      recipeOtherCostsApi.create(cost),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe-other-costs', variables.recipe_id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Other cost added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add cost: ${error.message}`);
    },
  });
};

export const useUpdateOtherCost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates, recipeId }: { id: string; updates: Partial<RecipeOtherCost>; recipeId: string }) =>
      recipeOtherCostsApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe-other-costs', variables.recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Other cost updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update cost: ${error.message}`);
    },
  });
};

export const useDeleteOtherCost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, recipeId }: { id: string; recipeId: string }) =>
      recipeOtherCostsApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe-other-costs', variables.recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Other cost deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete cost: ${error.message}`);
    },
  });
};
