import { supabase } from '@/integrations/supabase/client';

export interface ManufacturingBatch {
  id: string;
  organization_id: string;
  lot_id?: string;
  batch_number: string;
  total_quantity_manufactured: number;
  quantity_labeled: number;
  quantity_distributed: number;
  quantity_remaining: number;
  manufacturing_date: string;
  manufacturing_shift?: string;
  production_line?: string;
  production_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  inventory_lot?: {
    lot_number: string;
    item_id: string;
  };
  inventory_item?: {
    name: string;
    sku: string;
  };
}

export const manufacturingBatchesApi = {
  async getAll(): Promise<ManufacturingBatch[]> {
    const { data, error } = await supabase
      .from('manufacturing_batches')
      .select(`
        *,
        inventory_lots!inventory_lots_id_fkey(lot_number, item_id),
        inventory_items!inventory_lots_item_id_fkey(name, sku)
      `)
      .order('manufacturing_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByLotId(lotId: string): Promise<ManufacturingBatch[]> {
    const { data, error } = await supabase
      .from('manufacturing_batches')
      .select(`
        *,
        inventory_lots!inventory_lots_id_fkey(lot_number, item_id),
        inventory_items!inventory_lots_item_id_fkey(name, sku)
      `)
      .eq('lot_id', lotId)
      .order('manufacturing_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(batch: Omit<ManufacturingBatch, 'id' | 'created_at' | 'updated_at'>): Promise<ManufacturingBatch> {
    const { data, error } = await supabase
      .from('manufacturing_batches')
      .insert([batch])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<ManufacturingBatch>): Promise<ManufacturingBatch> {
    const { data, error } = await supabase
      .from('manufacturing_batches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('manufacturing_batches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByDateRange(startDate: string, endDate: string): Promise<ManufacturingBatch[]> {
    const { data, error } = await supabase
      .from('manufacturing_batches')
      .select(`
        *,
        inventory_lots!inventory_lots_id_fkey(lot_number, item_id),
        inventory_items!inventory_lots_item_id_fkey(name, sku)
      `)
      .gte('manufacturing_date', startDate)
      .lte('manufacturing_date', endDate)
      .order('manufacturing_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
