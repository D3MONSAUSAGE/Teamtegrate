import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionRecipesApi, ProductionRecipe, RecipeWithIngredients } from '@/contexts/inventory/api/productionRecipes';
import { teamItemPricingApi } from '@/contexts/inventory/api/teamItemPricing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RecipeIngredientWithCost {
  id: string;
  item_id: string;
  item_name: string;
  quantity_needed: number;
  unit: string;
  manual_unit_cost?: number;
  unit_cost: number;
  total_cost: number;
  sort_order: number;
  notes?: string;
}

export interface RecipeWithCosts extends ProductionRecipe {
  ingredients: RecipeIngredientWithCost[];
  total_cost: number;
  cost_per_unit: number;
}

const RECIPES_QUERY_KEY = ['production-recipes'];

/**
 * Calculate the cost for a single ingredient
 */
async function calculateIngredientCost(ingredient: any): Promise<RecipeIngredientWithCost> {
  let unitCost = 0;

  // 1. Check for manual override first
  if (ingredient.manual_unit_cost !== null && ingredient.manual_unit_cost !== undefined) {
    unitCost = ingredient.manual_unit_cost;
  } else {
    // 2. Get pricing from inventory (team-specific or global)
    try {
      const pricing = await teamItemPricingApi.getEffectivePricing(ingredient.item_id);
      unitCost = pricing.purchase_price || 0;
    } catch (error) {
      console.error('Error fetching pricing:', error);
      unitCost = 0;
    }
  }

  // Get item name
  const { data: item } = await supabase
    .from('inventory_items')
    .select('name')
    .eq('id', ingredient.item_id)
    .single();

  const totalCost = ingredient.quantity_needed * unitCost;

  return {
    id: ingredient.id,
    item_id: ingredient.item_id,
    item_name: item?.name || 'Unknown Item',
    quantity_needed: ingredient.quantity_needed,
    unit: ingredient.unit,
    manual_unit_cost: ingredient.manual_unit_cost,
    unit_cost: unitCost,
    total_cost: totalCost,
    sort_order: ingredient.sort_order,
    notes: ingredient.notes,
  };
}

/**
 * Calculate costs for a recipe with all its ingredients
 */
async function calculateRecipeCosts(recipe: RecipeWithIngredients): Promise<RecipeWithCosts> {
  const ingredientsWithCosts = await Promise.all(
    recipe.ingredients.map(calculateIngredientCost)
  );

  const totalCost = ingredientsWithCosts.reduce((sum, ing) => sum + ing.total_cost, 0);
  const costPerUnit = recipe.output_quantity > 0 ? totalCost / recipe.output_quantity : 0;

  return {
    ...recipe,
    ingredients: ingredientsWithCosts,
    total_cost: totalCost,
    cost_per_unit: costPerUnit,
  };
}

/**
 * Hook to fetch all recipes with calculated costs
 */
export function useRecipes() {
  return useQuery({
    queryKey: RECIPES_QUERY_KEY,
    queryFn: async () => {
      const recipes = await productionRecipesApi.getAll();
      const recipesWithIngredients = await Promise.all(
        recipes.map(async (recipe) => {
          const full = await productionRecipesApi.getById(recipe.id);
          return full!;
        })
      );
      return Promise.all(recipesWithIngredients.map(calculateRecipeCosts));
    },
  });
}

/**
 * Hook to fetch a single recipe with calculated costs
 */
export function useRecipeById(id: string) {
  return useQuery({
    queryKey: [...RECIPES_QUERY_KEY, id],
    queryFn: async () => {
      const recipe = await productionRecipesApi.getById(id);
      if (!recipe) return null;
      return calculateRecipeCosts(recipe);
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new recipe
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productionRecipesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
      toast.success('Recipe created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create recipe: ${error.message}`);
    },
  });
}

/**
 * Hook to update a recipe
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProductionRecipe> }) =>
      productionRecipesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
      toast.success('Recipe updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update recipe: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a recipe
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productionRecipesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
      toast.success('Recipe deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete recipe: ${error.message}`);
    },
  });
}

/**
 * Hook to duplicate a recipe
 */
export function useDuplicateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productionRecipesApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
      toast.success('Recipe duplicated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to duplicate recipe: ${error.message}`);
    },
  });
}
