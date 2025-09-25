import { supabase } from '@/integrations/supabase/client';
import { InventoryCount, InventoryCountItem } from '../types';
import { createTimestampInTZ } from '@/lib/dates/tz';

// Utility for chunked operations
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

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
    countedBy?: string,
    userTimezone?: string
  ): Promise<void> {
    const updateData: any = {
      actual_quantity: actualQuantity,
      counted_at: createTimestampInTZ(userTimezone || 'UTC'),
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
        // Get template items with their in-stock quantities
        const { data: templateItems, error: templateError } = await supabase
          .from('inventory_template_items')
          .select('item_id, in_stock_quantity')
          .eq('template_id', count.template_id);

        if (templateError) throw templateError;

        // Update count items with correct in-stock quantities
        const updatePromises = templateItems.map(templateItem => 
          supabase
            .from('inventory_count_items')
            .update({ in_stock_quantity: templateItem.in_stock_quantity })
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
            .update({ in_stock_quantity: countItem.inventory_items.current_stock || 0 })
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
            in_stock_quantity,
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
          in_stock_quantity: item.in_stock_quantity || item.inventory_items.current_stock || 0,
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
          in_stock_quantity: item.current_stock || 0,
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
        .select('actual_quantity, in_stock_quantity')
        .eq('count_id', countId);

      if (statsError) throw statsError;

      const totalItems = stats?.length || 0;
      const completedItems = stats?.filter(item => item.actual_quantity !== null).length || 0;
      const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
      
      // Calculate variance count
      const varianceCount = stats?.filter(item => 
        item.actual_quantity !== null && 
        Math.abs((item.actual_quantity || 0) - (item.in_stock_quantity || 0)) > 0.01
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
    updates: Array<{ itemId: string; actualQuantity: number; notes?: string; countedBy?: string }>,
    opts: { chunkSize?: number; interChunkDelayMs?: number } = {}
  ): Promise<{ saved: number; failed: Array<{ itemId: string; error: any }> }> {
    const chunkSize = opts.chunkSize ?? 8;           // Keep small to avoid pool pressure
    const interDelay = opts.interChunkDelayMs ?? 120;

    const errors: Array<{ itemId: string; error: any }> = [];
    let saved = 0;

    console.log('Starting chunked bulk update for count:', countId, 'with', updates.length, 'items');

    for (let i = 0; i < updates.length; i += chunkSize) {
      const batch = updates.slice(i, i + chunkSize);

      const results = await Promise.allSettled(
        batch.map(({ itemId, actualQuantity, notes, countedBy }) => {
          const updateData: any = {
            actual_quantity: actualQuantity,
            counted_at: createTimestampInTZ('UTC'), // Use UTC for bulk operations
          };

          if (notes) updateData.notes = notes;
          if (countedBy) updateData.counted_by = countedBy;

          return supabase
            .from('inventory_count_items')
            .update(updateData)
            .eq('count_id', countId)
            .eq('item_id', itemId);
        })
      );

      results.forEach((r, idx) => {
        if (r.status === 'rejected' || (r.value as any)?.error) {
          errors.push({
            itemId: batch[idx].itemId,
            error: r.status === 'rejected' ? r.reason : (r.value as any).error,
          });
        } else {
          saved += 1;
        }
      });

      // Tiny breather to keep Postgres happy
      await sleep(interDelay);
    }

    // Recompute totals ONCE (previously done many times)
    try {
      await this.updateCountTotals(countId);
    } catch (e) {
      console.warn('updateCountTotals failed:', e);
    }

    console.log(`Chunked bulk update completed: ${saved} saved, ${errors.length} failed`);
    return { saved, failed: errors };
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

  async cancelInventoryCount(countId: string, reason?: string): Promise<InventoryCount> {
    const cancelData: any = {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    };

    if (reason) {
      cancelData.notes = reason;
    }

    const { data, error } = await supabase
      .from('inventory_counts')
      .update(cancelData)
      .eq('id', countId)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryCount;
  },

  async bumpActual(countId: string, countItemId: string, delta: number): Promise<{ id: string; actual_quantity: number } | null> {
    console.log('[BUMP_REQUEST]', { countId, countItemId, delta });
    
    // IMPORTANT: Use countItemId (inventory_count_items.id) for targeting the row
    const { data: countItem, error: getError } = await supabase
      .from('inventory_count_items')
      .select('actual_quantity')
      .eq('count_id', countId)
      .eq('id', countItemId)  // <-- KEY FIX: use 'id' not 'item_id'
      .single();

    if (getError) {
      console.error('[BUMP_ERROR]', { countId, countItemId, delta, error: getError });
      throw getError;
    }

    const currentActual = countItem?.actual_quantity || 0;
    const newActual = currentActual + delta;

    // Update with new quantity
    const updateData = {
      actual_quantity: newActual,
      counted_at: createTimestampInTZ('UTC'),
    };

    const { data, error } = await supabase
      .from('inventory_count_items')
      .update(updateData)
      .eq('count_id', countId)
      .eq('id', countItemId)  // <-- KEY FIX: use 'id' not 'item_id'
      .select('id, actual_quantity')
      .single();

    if (error) {
      console.error('[BUMP_ERROR]', { countId, countItemId, delta, error });
      throw error;
    }

    console.log('[BUMP_RESPONSE]', { countId, countItemId, delta, updated: data });
    return data;
  },

  async setActual(countId: string, countItemId: string, qty: number): Promise<{ id: string; actual_quantity: number } | null> {
    console.log('[SET_ACTUAL_REQUEST]', { countId, countItemId, qty });
    
    const updateData = {
      actual_quantity: qty,
      counted_at: createTimestampInTZ('UTC'),
    };

    const { data, error } = await supabase
      .from('inventory_count_items')
      .update(updateData)
      .eq('count_id', countId)
      .eq('id', countItemId)  // <-- KEY FIX: use 'id' not 'item_id'
      .select('id, actual_quantity')
      .single();

    if (error) {
      console.error('[SET_ACTUAL_ERROR]', { countId, countItemId, qty, error });
      throw error;
    }

    console.log('[SET_ACTUAL_RESPONSE]', { countId, countItemId, qty, updated: data });
    return data;
  },

  async updateInventoryStockFromCount(countId: string): Promise<void> {
    try {
      // Get all count items with actual quantities
      const { data: countItems, error: countError } = await supabase
        .from('inventory_count_items')
        .select(`
          item_id,
          actual_quantity,
          in_stock_quantity
        `)
        .eq('count_id', countId)
        .not('actual_quantity', 'is', null);

      if (countError) throw countError;

      if (!countItems || countItems.length === 0) {
        console.log('No counted items found for stock update');
        return;
      }

      // Update inventory items current_stock and create adjustment transactions
      const stockUpdates = [];
      const adjustmentTransactions = [];

      for (const countItem of countItems) {
        const actualQuantity = countItem.actual_quantity;
        const inStockQuantity = countItem.in_stock_quantity || 0;
        const adjustment = actualQuantity - inStockQuantity;

        // Update inventory item stock
        stockUpdates.push(
          supabase
            .from('inventory_items')
            .update({ current_stock: actualQuantity })
            .eq('id', countItem.item_id)
        );

        // Create adjustment transaction if there's a difference
        if (Math.abs(adjustment) > 0.01) {
          adjustmentTransactions.push({
            organization_id: (await supabase
              .from('inventory_counts')
              .select('organization_id')
              .eq('id', countId)
              .single()).data?.organization_id,
            item_id: countItem.item_id,
            transaction_type: 'adjustment',
            quantity_change: adjustment,
            transaction_date: new Date().toISOString(),
            reference_id: countId,
            reference_type: 'inventory_count',
            notes: `Stock adjustment from inventory count (${inStockQuantity} → ${actualQuantity})`
          });
        }
      }

      // Execute all stock updates
      const updateResults = await Promise.all(stockUpdates);
      const updateErrors = updateResults.filter(result => result.error);

      if (updateErrors.length > 0) {
        throw new Error(`Failed to update ${updateErrors.length} items: ${updateErrors[0].error?.message}`);
      }

      // Create adjustment transactions if any
      if (adjustmentTransactions.length > 0) {
        const { error: transactionError } = await supabase
          .from('inventory_transactions')
          .insert(adjustmentTransactions);

        if (transactionError) {
          console.error('Failed to create adjustment transactions:', transactionError);
          // Don't throw here - stock updates succeeded, transactions are for audit only
        }
      }

      console.log(`Successfully updated stock for ${countItems.length} items, created ${adjustmentTransactions.length} adjustment transactions`);
    } catch (error) {
      console.error('Error updating inventory stock from count:', error);
      throw error;
    }
  },

  async voidInventoryCount(countId: string, reason?: string): Promise<InventoryCount> {
    const voidData: any = {
      is_voided: true,
      voided_by: (await supabase.auth.getUser()).data.user?.id,
      voided_at: new Date().toISOString(),
      void_reason: reason || 'No reason provided',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('inventory_counts')
      .update(voidData)
      .eq('id', countId)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryCount;
  },
};