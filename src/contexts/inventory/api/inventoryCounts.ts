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
      .order('counted_at', { ascending: false, nullsFirst: false });

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
    try {
      // Get all active inventory items with organization filtering
      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('id, current_stock, organization_id')
        .eq('is_active', true);

      if (itemsError) {
        console.error('Error fetching inventory items for count initialization:', itemsError);
        throw new Error(`Failed to fetch inventory items: ${itemsError.message}`);
      }

      if (!items || items.length === 0) {
        console.warn('No active inventory items found for count initialization');
        return;
      }

      const countItems = items.map(item => ({
        count_id: countId,
        item_id: item.id,
        expected_quantity: item.current_stock || 0,
      }));

      const { error } = await supabase
        .from('inventory_count_items')
        .insert(countItems);

      if (error) {
        console.error('Error inserting count items:', error);
        throw new Error(`Failed to initialize count items: ${error.message}`);
      }

      console.log(`Successfully initialized ${countItems.length} count items for count ${countId}`);
    } catch (error) {
      console.error('Error in initializeCountItems:', error);
      throw error;
    }
  },

  async bulkCreateCountItems(countItems: any[]): Promise<void> {
    const { error } = await supabase
      .from('inventory_count_items')
      .insert(countItems);

    if (error) throw error;
  },

  async bulkUpdateCountItems(
    countId: string,
    updates: Array<{ itemId: string; actualQuantity: number; notes?: string; countedBy?: string }>
  ): Promise<void> {
    try {
      console.log('Starting bulk update for count:', countId, 'with', updates.length, 'items');
      
      // Prepare bulk update operations
      const updatePromises = updates.map(({ itemId, actualQuantity, notes, countedBy }) => {
        const updateData: any = {
          actual_quantity: actualQuantity,
          counted_at: new Date().toISOString(),
        };

        if (notes) updateData.notes = notes;
        if (countedBy) updateData.counted_by = countedBy;

        return supabase
          .from('inventory_count_items')
          .upsert({
            count_id: countId,
            item_id: itemId,
            expected_quantity: 0, // This will be updated by a trigger or separate call
            ...updateData,
          }, {
            onConflict: 'count_id,item_id'
          });
      });

      // Execute all updates in parallel
      const results = await Promise.all(updatePromises);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Bulk update errors:', errors);
        throw new Error(`Failed to update ${errors.length} items: ${errors[0].error?.message}`);
      }

      console.log(`Successfully updated ${updates.length} count items`);
    } catch (error) {
      console.error('Error in bulkUpdateCountItems:', error);
      throw error;
    }
  },

  async getTemplateItems(templateId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('inventory_template_items')
      .select(`
        *,
        inventory_items(*)
      `)
      .eq('template_id', templateId);

    if (error) throw error;
    return data || [];
  },
};