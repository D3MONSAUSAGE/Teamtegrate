import { supabase } from '@/integrations/supabase/client';

export interface RecipeOtherCost {
  id: string;
  recipe_id: string;
  category_id: string;
  cost_amount: number;
  notes?: string;
  created_at: string;
}

export interface RecipeOtherCostWithCategory extends RecipeOtherCost {
  category_name?: string;
  category_description?: string;
}

export const recipeOtherCostsApi = {
  async getByRecipe(recipeId: string): Promise<RecipeOtherCostWithCategory[]> {
    const { data, error } = await supabase
      .from('recipe_other_costs')
      .select(`
        *,
        recipe_cost_categories (
          name,
          description
        )
      `)
      .eq('recipe_id', recipeId);

    if (error) throw error;

    // Transform the data to flatten the category info
    return (data || []).map((cost: any) => ({
      id: cost.id,
      recipe_id: cost.recipe_id,
      category_id: cost.category_id,
      cost_amount: cost.cost_amount,
      notes: cost.notes,
      created_at: cost.created_at,
      category_name: cost.recipe_cost_categories?.name,
      category_description: cost.recipe_cost_categories?.description,
    }));
  },

  async create(cost: Omit<RecipeOtherCost, 'id' | 'created_at'>): Promise<RecipeOtherCost> {
    const { data, error } = await supabase
      .from('recipe_other_costs')
      .insert([cost])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<RecipeOtherCost>): Promise<RecipeOtherCost> {
    const { data, error } = await supabase
      .from('recipe_other_costs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('recipe_other_costs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
