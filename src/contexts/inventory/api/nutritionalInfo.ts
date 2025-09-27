import { supabase } from '@/integrations/supabase/client';

export interface NutritionalInfo {
  id: string;
  organization_id: string;
  item_id: string;
  serving_size?: string;
  servings_per_container?: number;
  calories?: number;
  total_fat?: number;
  saturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  sodium?: number;
  total_carbohydrates?: number;
  dietary_fiber?: number;
  total_sugars?: number;
  added_sugars?: number;
  protein?: number;
  vitamin_d?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  ingredients?: string;
  allergens?: string[];
  additional_nutrients: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const nutritionalInfoApi = {
  async getByItemId(itemId: string): Promise<NutritionalInfo | null> {
    const { data, error } = await supabase
      .from('inventory_nutritional_info')
      .select('*')
      .eq('item_id', itemId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async create(info: Omit<NutritionalInfo, 'id' | 'created_at' | 'updated_at'>): Promise<NutritionalInfo> {
    const { data, error } = await supabase
      .from('inventory_nutritional_info')
      .insert([info])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(itemId: string, updates: Partial<NutritionalInfo>): Promise<NutritionalInfo> {
    const { data, error } = await supabase
      .from('inventory_nutritional_info')
      .update(updates)
      .eq('item_id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_nutritional_info')
      .delete()
      .eq('item_id', itemId);

    if (error) throw error;
  },

  async upsert(info: Omit<NutritionalInfo, 'id' | 'created_at' | 'updated_at'>): Promise<NutritionalInfo> {
    const { data, error } = await supabase
      .from('inventory_nutritional_info')
      .upsert([info], {
        onConflict: 'item_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};