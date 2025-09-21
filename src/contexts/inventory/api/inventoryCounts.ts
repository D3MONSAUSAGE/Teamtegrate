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
      .update(updateData)
      .eq('count_id', countId)
      .eq('item_id', itemId);

    if (error) throw error;
  },

  async repairCountExpectedQuantities(countId: string): Promise<void> {
    try {
      // Get the count to find its template_id
      const { data: count, error: countError } = await supabase
        .from('inventory_counts')
        .select('template_id')
        .eq('id', countId)
        .single();

      if (countError) throw countError;

      if (count.template_id) {
        // Get template items with their expected quantities
        const { data: templateItems, error: templateError } = await supabase
          .from('inventory_template_items')
          .select('item_id, expected_quantity')
          .eq('template_id', count.template_id);

        if (templateError) throw templateError;

        // Update count items with correct expected quantities
        const updatePromises = templateItems.map(templateItem => 
          supabase
            .from('inventory_count_items')
            .update({ expected_quantity: templateItem.expected_quantity })
            .eq('count_id', countId)
            .eq('item_id', templateItem.item_id)
        );

        const results = await Promise.all(updatePromises);
        const errors = results.filter(result => result.error);
        
        if (errors.length > 0) {
          throw new Error(`Failed to repair ${errors.length} items: ${errors[0].error?.message}`);
        }

        // Update count totals
        await this.updateCountTotals(countId);
        
        console.log(`Successfully repaired expected quantities for ${templateItems.length} items`);
      } else {
        // Fallback to current stock for counts without templates
        const { data: countItems, error: itemsError } = await supabase
          .from('inventory_count_items')
          .select(`
            item_id,
            inventory_items!inner(current_stock)
          `)
          .eq('count_id', countId);

        if (itemsError) throw itemsError;

        const updatePromises = countItems.map(countItem => 
          supabase
            .from('inventory_count_items')
            .update({ expected_quantity: countItem.inventory_items.current_stock || 0 })
            .eq('count_id', countId)
            .eq('item_id', countItem.item_id)
        );

        const results = await Promise.all(updatePromises);
        const errors = results.filter(result => result.error);
        
        if (errors.length > 0) {
          throw new Error(`Failed to repair ${errors.length} items: ${errors[0].error?.message}`);
        }

        await this.updateCountTotals(countId);
        console.log(`Successfully repaired expected quantities for ${countItems.length} items using current stock`);
      }
    } catch (error) {
      console.error('Error repairing count expected quantities:', error);
      throw error;
    }
  },

  async initializeCountItems(countId: string, templateId?: string): Promise<void> {
    try {
      let countItems: any[] = [];

      if (templateId) {
        // Initialize from template
        const { data: templateItems, error: templateError } = await supabase
          .from('inventory_template_items')
          .select(`
            item_id,
            expected_quantity,
            minimum_quantity,
            maximum_quantity,
            inventory_items!inner(id, current_stock, is_active)
          `)
          .eq('template_id', templateId)
          .eq('inventory_items.is_active', true);

        if (templateError) {
          console.error('Error fetching template items:', templateError);
          throw new Error(`Failed to fetch template items: ${templateError.message}`);
        }

        countItems = (templateItems || []).map(item => ({
          count_id: countId,
          item_id: item.item_id,
          expected_quantity: item.expected_quantity || item.inventory_items.current_stock || 0,
          template_minimum_quantity: item.minimum_quantity,
          template_maximum_quantity: item.maximum_quantity,
        }));
      } else {
        // Initialize from all active items
        const { data: items, error: itemsError } = await supabase
          .from('inventory_items')
          .select('id, current_stock, organization_id')
          .eq('is_active', true);

        if (itemsError) {
          console.error('Error fetching inventory items for count initialization:', itemsError);
          throw new Error(`Failed to fetch inventory items: ${itemsError.message}`);
        }

        countItems = (items || []).map(item => ({
          count_id: countId,
          item_id: item.id,
          expected_quantity: item.current_stock || 0,
        }));
      }

      if (countItems.length === 0) {
        console.warn('No items found for count initialization');
        return;
      }

      const { error } = await supabase
        .from('inventory_count_items')
        .insert(countItems);

      if (error) {
        console.error('Error inserting count items:', error);
        throw new Error(`Failed to initialize count items: ${error.message}`);
      }

      // Update the count's total_items_count
      await this.updateCountTotals(countId);

      console.log(`Successfully initialized ${countItems.length} count items for count ${countId}`);
    } catch (error) {
      console.error('Error in initializeCountItems:', error);
      throw error;
    }
  },

  async updateCountTotals(countId: string): Promise<void> {
    try {
      // Get count statistics
      const { data: stats, error: statsError } = await supabase
        .from('inventory_count_items')
        .select('actual_quantity, expected_quantity')
        .eq('count_id', countId);

      if (statsError) throw statsError;

      const totalItems = stats?.length || 0;
      const completedItems = stats?.filter(item => item.actual_quantity !== null).length || 0;
      const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
      
      // Calculate variance count
      const varianceCount = stats?.filter(item => 
        item.actual_quantity !== null && 
        Math.abs((item.actual_quantity || 0) - (item.expected_quantity || 0)) > 0.01
      ).length || 0;

      // Update the count record
      const { error: updateError } = await supabase
        .from('inventory_counts')
        .update({
          total_items_count: totalItems,
          completion_percentage: completionPercentage,
          variance_count: varianceCount,
        })
        .eq('id', countId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating count totals:', error);
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
          .update(updateData)
          .eq('count_id', countId)
          .eq('item_id', itemId);
      });

      // Execute all updates in parallel
      const results = await Promise.all(updatePromises);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Bulk update errors:', errors);
        throw new Error(`Failed to update ${errors.length} items: ${errors[0].error?.message}`);
      }

      // Update count totals after successful bulk update
      await this.updateCountTotals(countId);

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