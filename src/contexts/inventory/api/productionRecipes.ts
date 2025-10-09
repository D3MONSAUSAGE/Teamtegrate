import { supabase } from '@/integrations/supabase/client';

export interface ProductionRecipe {
  id: string;
  organization_id: string;
  user_id?: string;
  team_id?: string;
  name: string;
  description?: string;
  output_quantity: number;
  output_unit: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  item_id: string;
  quantity_needed: number;
  unit: string;
  manual_unit_cost?: number | null;
  cost_per_base_unit?: number | null;
  base_unit?: string | null;
  packaging_info?: string | null;
  purchase_price_snapshot?: number | null;
  conversion_factor_snapshot?: number | null;
  sort_order: number;
  notes?: string | null;
  created_at: string;
}

export interface RecipeWithIngredients extends ProductionRecipe {
  ingredients: RecipeIngredient[];
}

export const productionRecipesApi = {
  /**
   * Get all recipes for the current user
   */
  async getAll(): Promise<ProductionRecipe[]> {
    const { data, error } = await supabase
      .from('production_recipes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single recipe with its ingredients
   */
  async getById(id: string): Promise<RecipeWithIngredients | null> {
    const { data: recipe, error: recipeError } = await supabase
      .from('production_recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (recipeError) throw recipeError;
    if (!recipe) return null;

    const { data: ingredients, error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('recipe_id', id)
      .order('sort_order', { ascending: true });

    if (ingredientsError) throw ingredientsError;

    return {
      ...recipe,
      ingredients: ingredients || [],
    };
  },

  /**
   * Create a new recipe
   */
  async create(
    recipe: Omit<ProductionRecipe, 'id' | 'created_at' | 'updated_at' | 'organization_id'> & { team_id: string }
  ): Promise<ProductionRecipe> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) throw new Error('Not authenticated');

    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.user.id)
      .single();

    if (userDataError || !userData) throw new Error('Could not get user data');

    const { data, error } = await supabase
      .from('production_recipes')
      .insert([{
        ...recipe,
        organization_id: userData.organization_id,
        user_id: user.user.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing recipe
   */
  async update(id: string, updates: Partial<ProductionRecipe>): Promise<ProductionRecipe> {
    const { data, error } = await supabase
      .from('production_recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a recipe (soft delete by setting is_active to false)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('production_recipes')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Duplicate a recipe
   */
  async duplicate(id: string): Promise<ProductionRecipe> {
    const original = await this.getById(id);
    if (!original) throw new Error('Recipe not found');

    // Create new recipe with "Copy" suffix
    const newRecipe = await this.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      output_quantity: original.output_quantity,
      output_unit: original.output_unit,
      notes: original.notes,
      is_active: true,
      team_id: original.team_id!,
    });

    // Copy ingredients
    if (original.ingredients.length > 0) {
      const newIngredients = original.ingredients.map((ing) => ({
        recipe_id: newRecipe.id,
        item_id: ing.item_id,
        quantity_needed: ing.quantity_needed,
        unit: ing.unit,
        manual_unit_cost: ing.manual_unit_cost,
        sort_order: ing.sort_order,
        notes: ing.notes,
      }));

      const { error } = await supabase
        .from('recipe_ingredients')
        .insert(newIngredients);

      if (error) throw error;
    }

    // Copy other costs
    const { data: otherCosts } = await supabase
      .from('recipe_other_costs')
      .select('*')
      .eq('recipe_id', id);

    if (otherCosts && otherCosts.length > 0) {
      const newOtherCosts = otherCosts.map((cost) => ({
        recipe_id: newRecipe.id,
        category_id: cost.category_id,
        cost_amount: cost.cost_amount,
        notes: cost.notes,
      }));

      const { error } = await supabase
        .from('recipe_other_costs')
        .insert(newOtherCosts);

      if (error) throw error;
    }

    return newRecipe;
  },
};

export const recipeIngredientsApi = {
  /**
   * Get all ingredients for a recipe
   */
  async getByRecipe(recipeId: string): Promise<RecipeIngredient[]> {
    const { data, error } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Add an ingredient to a recipe
   */
  async create(ingredient: Omit<RecipeIngredient, 'id' | 'created_at'>): Promise<RecipeIngredient> {
    const { data, error } = await supabase
      .from('recipe_ingredients')
      .insert([ingredient])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an ingredient
   */
  async update(id: string, updates: Partial<RecipeIngredient>): Promise<RecipeIngredient> {
    const { data, error } = await supabase
      .from('recipe_ingredients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete an ingredient
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
