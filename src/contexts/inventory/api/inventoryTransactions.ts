import { supabase } from '@/integrations/supabase/client';
import { InventoryTransaction } from '../types';

export const inventoryTransactionsApi = {
  async getAll(teamId?: string): Promise<InventoryTransaction[]> {
    let query = supabase
      .from('inventory_transactions')
      .select(`
        *,
        inventory_items(name, sku, barcode, description),
        teams(id, name),
        warehouses(id, name, location)
      `);

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query.order('transaction_date', { ascending: false });

    if (error) throw error;
    
    // Enhanced transactions with processor info
    const enhancedTransactions = await Promise.all(
      (data || []).map(async (transaction: any) => {
        // Fetch processor name if created_by exists
        let processorInfo = null;
        if (transaction.created_by) {
          const { data: userInfo } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', transaction.created_by)
            .single();
          
          if (userInfo) {
            processorInfo = {
              processor_name: userInfo.name,
              processor_email: userInfo.email
            };
          }
        }
        
        return { ...transaction, ...processorInfo };
      })
    );
    
    return enhancedTransactions as InventoryTransaction[];
  },

  async create(transaction: Omit<InventoryTransaction, 'id' | 'created_at'>): Promise<InventoryTransaction> {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data as InventoryTransaction;
  },

  async getByItemId(itemId: string): Promise<InventoryTransaction[]> {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('item_id', itemId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return (data || []) as InventoryTransaction[];
  },

  async getByType(transactionType: InventoryTransaction['transaction_type'], teamId?: string): Promise<InventoryTransaction[]> {
    let query = supabase
      .from('inventory_transactions')
      .select(`
        *,
        inventory_items(name, sku, barcode, description),
        teams(id, name),
        warehouses(id, name, location)
      `)
      .eq('transaction_type', transactionType);

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query.order('transaction_date', { ascending: false });

    if (error) throw error;
    
    // Enhanced transactions with processor info
    const enhancedTransactions = await Promise.all(
      (data || []).map(async (transaction: any) => {
        // Fetch processor name if created_by exists
        let processorInfo = null;
        if (transaction.created_by) {
          const { data: userInfo } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', transaction.created_by)
            .single();
          
          if (userInfo) {
            processorInfo = {
              processor_name: userInfo.name,
              processor_email: userInfo.email
            };
          }
        }
        
        return { ...transaction, ...processorInfo };
      })
    );
    
    return enhancedTransactions as InventoryTransaction[];
  },
};