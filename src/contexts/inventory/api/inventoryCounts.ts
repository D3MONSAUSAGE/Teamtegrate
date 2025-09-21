import { supabase } from '@/integrations/supabase/client';
import { InventoryCount, InventoryCountItem } from '../types';

export const inventoryCountsApi = {
  async getAll(): Promise<InventoryCount[]> {
    const { data, error } = await supabase
      .from('inventory_counts')
      .select('*')
      .order('count_date', { ascending: false });

    if (error) throw error;
    return (data || []) as InventoryCount[];
  },

  async create(count: Omit<InventoryCount, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryCount> {
    const { data, error } = await supabase
      .from('inventory_counts')
      .insert([count])
      .select()
      .single();

    if (error) throw error;
    return data as InventoryCount;
  },

  async update(id: string, updates: Partial<InventoryCount>): Promise<InventoryCount> {
    const { data, error } = await supabase
      .from('inventory_counts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryCount;
  },

  async getCountItems(countId: string): Promise<InventoryCountItem[]> {
    const { data, error } = await supabase
      .from('inventory_count_items')
      .select(`
        *,
        inventory_items(*)
      `)
      .eq('count_id', countId)
      .order('created_at');

    if (error) throw error;
    return (data || []) as InventoryCountItem[];
  },

  async updateCountItem(
    countId: string, 
    itemId: string, 
    actualQuantity: number, 
    notes?: string, 
    countedBy?: string
  ): Promise<void> {
    const updateData: any = {
      actual_quantity: actualQuantity,
      counted_at: new Date().toISOString(),
    };

    if (notes) updateData.notes = notes;
    if (countedBy) updateData.counted_by = countedBy;

    const { error } = await supabase
      .from('inventory_count_items')
      .upsert({
        count_id: countId,
        item_id: itemId,
        expected_quantity: 0, // This will be updated by a trigger or separate call
        ...updateData,
      });

    if (error) throw error;
  },

  async initializeCountItems(countId: string): Promise<void> {
    // This would typically be done via a stored procedure or edge function
    // For now, we'll create count items for all active inventory items
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('id, current_stock')
      .eq('is_active', true);

    if (itemsError) throw itemsError;

    if (items && items.length > 0) {
      const countItems = items.map(item => ({
        count_id: countId,
        item_id: item.id,
        expected_quantity: item.current_stock,
      }));

      const { error } = await supabase
        .from('inventory_count_items')
        .insert(countItems);

      if (error) throw error;
    }
  },
};