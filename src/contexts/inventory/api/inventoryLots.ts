import { supabase } from '@/integrations/supabase/client';

export interface InventoryLot {
  id: string;
  organization_id: string;
  item_id: string;
  lot_number: string;
  manufacturing_date?: string;
  expiration_date?: string;
  quantity_received: number;
  quantity_remaining: number;
  cost_per_unit?: number;
  supplier_info: any;
  notes?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  inventory_item?: {
    name: string;
    sku: string;
    barcode?: string;
  };
}

export const inventoryLotsApi = {
  async getAll(): Promise<InventoryLot[]> {
    const { data, error } = await supabase
      .from('inventory_lots')
      .select(`
        *,
        inventory_items(name, sku, barcode)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByItemId(itemId: string): Promise<InventoryLot[]> {
    const { data, error } = await supabase
      .from('inventory_lots')
      .select(`
        *,
        inventory_items(name, sku, barcode)
      `)
      .eq('item_id', itemId)
      .eq('is_active', true)
      .order('expiration_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data || [];
  },

  async create(lot: Omit<InventoryLot, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryLot> {
    const { data, error } = await supabase
      .from('inventory_lots')
      .insert([lot])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<InventoryLot>): Promise<InventoryLot> {
    const { data, error } = await supabase
      .from('inventory_lots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_lots')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  async getExpiringLots(daysAhead: number = 30): Promise<InventoryLot[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('inventory_lots')
      .select(`
        *,
        inventory_items(name, sku, barcode)
      `)
      .eq('is_active', true)
      .not('expiration_date', 'is', null)
      .lte('expiration_date', futureDate.toISOString().split('T')[0])
      .gt('quantity_remaining', 0)
      .order('expiration_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};