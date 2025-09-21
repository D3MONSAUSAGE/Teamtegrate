import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '../types';

export const inventoryItemsApi = {
  async getAll(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []) as InventoryItem[];
  },

  async create(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data as InventoryItem;
  },

  async update(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryItem;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  async getById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as InventoryItem;
  },

  async updateStock(id: string, newStock: number): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', id);

    if (error) throw error;
  },
};