import { supabase } from '@/integrations/supabase/client';
import { InventoryTransaction } from '../types';

export const inventoryTransactionsApi = {
  async getAll(): Promise<InventoryTransaction[]> {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select(`
        *,
        inventory_items(name)
      `)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return (data || []) as InventoryTransaction[];
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

  async getByType(transactionType: InventoryTransaction['transaction_type']): Promise<InventoryTransaction[]> {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select(`
        *,
        inventory_items(name)
      `)
      .eq('transaction_type', transactionType)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return (data || []) as InventoryTransaction[];
  },
};