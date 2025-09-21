import { supabase } from '@/integrations/supabase/client';
import { InventoryCategory } from '../types';

export const inventoryCategoriesApi = {
  async getAll(): Promise<InventoryCategory[]> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []) as InventoryCategory[];
  },

  async create(category: Omit<InventoryCategory, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryCategory> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data as InventoryCategory;
  },

  async update(id: string, updates: Partial<InventoryCategory>): Promise<InventoryCategory> {
    const { data, error } = await supabase
      .from('inventory_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryCategory;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_categories')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },
};