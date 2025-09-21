import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '../types';

export const inventoryItemsApi = {
  async getAll(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(id, name, description),
        base_unit:inventory_units(id, name, abbreviation, unit_type)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []) as InventoryItem[];
  },

  async create(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'category' | 'base_unit' | 'calculated_unit_price'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([item])
      .select(`
        *,
        category:inventory_categories(id, name, description),
        base_unit:inventory_units(id, name, abbreviation, unit_type)
      `)
      .single();

    if (error) throw error;
    return data as InventoryItem;
  },

  async update(id: string, updates: Partial<Omit<InventoryItem, 'category' | 'base_unit' | 'calculated_unit_price'>>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:inventory_categories(id, name, description),
        base_unit:inventory_units(id, name, abbreviation, unit_type)
      `)
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
      .select(`
        *,
        category:inventory_categories(id, name, description),
        base_unit:inventory_units(id, name, abbreviation, unit_type)
      `)
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