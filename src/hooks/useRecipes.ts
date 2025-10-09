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
  ingredient_cost: number;
  other_costs_total: number;
  total_cost: number;
  cost_per_unit: number;
  team_id?: string;
}

const RECIPES_QUERY_KEY = ['production-recipes'];

/**
 * Get packaging info and calculate cost per base unit for an inventory item
 */
export async function getItemPackagingInfo(itemId: string) {
  const { data: item } = await supabase
    .from('inventory_items')
    .select('name, unit_of_measure, purchase_unit, conversion_factor, purchase_price')
    .eq('id', itemId)
    .single();

  if (!item) {
    throw new Error('Item not found');
  }

  // Calculate cost per base unit
  let costPerBaseUnit = 0;
  if (item.purchase_price && item.conversion_factor && item.conversion_factor > 0) {
    costPerBaseUnit = item.purchase_price / item.conversion_factor;
  } else if (item.purchase_price) {
    costPerBaseUnit = item.purchase_price; // Assume conversion = 1
  }

  // Build packaging info string
  const packagingInfo = item.purchase_unit && item.purchase_price
    ? `${item.purchase_unit} @ $${item.purchase_price.toFixed(2)}`
    : null;

  return {
    name: item.name,
    baseUnit: item.unit_of_measure,
    purchaseUnit: item.purchase_unit,
    conversionFactor: item.conversion_factor,
    purchasePrice: item.purchase_price,
    costPerBaseUnit,
    packagingInfo,
  };
}

/**
 * Calculate the cost for a single ingredient using unit conversion
 */
async function calculateIngredientCost(ingredient: any): Promise<RecipeIngredientWithCost> {
  let unitCost = 0;

  // 1. Check for manual override first
  if (ingredient.manual_unit_cost !== null && ingredient.manual_unit_cost !== undefined) {
    unitCost = ingredient.manual_unit_cost;
  } else if (ingredient.cost_per_base_unit !== null && ingredient.cost_per_base_unit !== undefined) {
    // 2. Use historical snapshot if available
    unitCost = ingredient.cost_per_base_unit;
  } else {
    // 3. Calculate from current inventory data
    try {
      const packagingInfo = await getItemPackagingInfo(ingredient.item_id);
      unitCost = packagingInfo.costPerBaseUnit;
    } catch (error) {
      console.error('Error fetching packaging info:', error);
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
 * Calculate costs for a recipe with all its ingredients and other costs
 */
async function calculateRecipeCosts(recipe: RecipeWithIngredients): Promise<RecipeWithCosts> {
  const ingredientsWithCosts = await Promise.all(
    recipe.ingredients.map(calculateIngredientCost)
  );

  const ingredientTotal = ingredientsWithCosts.reduce((sum, ing) => sum + ing.total_cost, 0);

  // Fetch and sum other costs
  const { data: otherCosts } = await supabase
    .from('recipe_other_costs')
    .select('cost_amount')
    .eq('recipe_id', recipe.id);
  
  const otherCostsTotal = otherCosts?.reduce((sum, cost) => sum + cost.cost_amount, 0) || 0;

  // Calculate totals
  const totalCost = ingredientTotal + otherCostsTotal;
  const costPerUnit = recipe.output_quantity > 0 ? totalCost / recipe.output_quantity : 0;

  return {
    ...recipe,
    ingredients: ingredientsWithCosts,
    ingredient_cost: ingredientTotal,
    other_costs_total: otherCostsTotal,
    total_cost: totalCost,
    cost_per_unit: costPerUnit,
  };
}

/**
 * Hook to fetch all recipes with calculated costs, optionally filtered by team
 */
export function useRecipes(teamId?: string) {
  return useQuery({
    queryKey: [...RECIPES_QUERY_KEY, teamId],
    queryFn: async () => {
      let recipes = await productionRecipesApi.getAll();
      
      // Filter by team if provided
      if (teamId) {
        recipes = recipes.filter(r => r.team_id === teamId);
      }
      
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

/**
 * Hook to refresh recipe prices from current inventory
 */
export function useRefreshRecipePrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      const recipe = await productionRecipesApi.getById(recipeId);
      if (!recipe) throw new Error('Recipe not found');

      for (const ingredient of recipe.ingredients) {
        try {
          const packagingInfo = await getItemPackagingInfo(ingredient.item_id);
          
          await supabase
            .from('recipe_ingredients')
            .update({
              cost_per_base_unit: packagingInfo.costPerBaseUnit,
              base_unit: packagingInfo.baseUnit,
              packaging_info: packagingInfo.packagingInfo,
              purchase_price_snapshot: packagingInfo.purchasePrice,
              conversion_factor_snapshot: packagingInfo.conversionFactor,
            })
            .eq('id', ingredient.id);
        } catch (error) {
          console.error(`Failed to refresh price for ingredient ${ingredient.id}:`, error);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_QUERY_KEY });
      toast.success('Recipe prices refreshed successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to refresh prices: ${error.message}`);
    },
  });
}
