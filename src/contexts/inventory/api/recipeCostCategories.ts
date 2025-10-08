import { supabase } from '@/integrations/supabase/client';

export interface RecipeCostCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const recipeCostCategoriesApi = {
  async getAll(): Promise<RecipeCostCategory[]> {
    const { data, error } = await supabase
      .from('recipe_cost_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(category: Omit<RecipeCostCategory, 'id' | 'created_at' | 'updated_at' | 'organization_id'>): Promise<RecipeCostCategory> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) throw new Error('Not authenticated');

    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.user.id)
      .single();

    if (userDataError || !userData) throw new Error('Could not get user data');

    const { data, error } = await supabase
      .from('recipe_cost_categories')
      .insert([{
        ...category,
        organization_id: userData.organization_id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<RecipeCostCategory>): Promise<RecipeCostCategory> {
    const { data, error } = await supabase
      .from('recipe_cost_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('recipe_cost_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
