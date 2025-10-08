import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeCostCategoriesApi, RecipeCostCategory } from '@/contexts/inventory/api/recipeCostCategories';
import { toast } from 'sonner';

export const useRecipeCostCategories = () => {
  return useQuery({
    queryKey: ['recipe-cost-categories'],
    queryFn: () => recipeCostCategoriesApi.getAll(),
  });
};

export const useCreateCostCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: Omit<RecipeCostCategory, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) =>
      recipeCostCategoriesApi.create(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-cost-categories'] });
      toast.success('Cost category created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });
};

export const useUpdateCostCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<RecipeCostCategory> }) =>
      recipeCostCategoriesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-cost-categories'] });
      toast.success('Cost category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
};

export const useDeleteCostCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recipeCostCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-cost-categories'] });
      toast.success('Cost category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });
};
