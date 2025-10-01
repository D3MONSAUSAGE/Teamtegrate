import { supabase } from '@/integrations/supabase/client';

export interface ProductDistribution {
  id: string;
  organization_id: string;
  batch_id?: string;
  lot_id?: string;
  customer_name: string;
  destination_location?: string;
  quantity_shipped: number;
  shipment_date: string;
  tracking_number?: string;
  sales_order_reference?: string;
  delivery_status: string;
  notes?: string;
  created_by: string;
  created_at: string;
  // Joined data
  manufacturing_batch?: {
    batch_number: string;
    manufacturing_date: string;
  };
  inventory_lot?: {
    lot_number: string;
    item_id: string;
  };
  inventory_item?: {
    name: string;
    sku: string;
  };
}

export const productDistributionsApi = {
  async getAll(): Promise<ProductDistribution[]> {
    const { data, error } = await supabase
      .from('product_distributions')
      .select(`
        *,
        manufacturing_batches(batch_number, manufacturing_date),
        inventory_lots(lot_number, item_id),
        inventory_items(name, sku)
      `)
      .order('shipment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByBatchId(batchId: string): Promise<ProductDistribution[]> {
    const { data, error } = await supabase
      .from('product_distributions')
      .select(`
        *,
        manufacturing_batches(batch_number, manufacturing_date),
        inventory_lots(lot_number, item_id),
        inventory_items(name, sku)
      `)
      .eq('batch_id', batchId)
      .order('shipment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByLotId(lotId: string): Promise<ProductDistribution[]> {
    const { data, error } = await supabase
      .from('product_distributions')
      .select(`
        *,
        manufacturing_batches(batch_number, manufacturing_date),
        inventory_lots(lot_number, item_id),
        inventory_items(name, sku)
      `)
      .eq('lot_id', lotId)
      .order('shipment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(distribution: Omit<ProductDistribution, 'id' | 'created_at'>): Promise<ProductDistribution> {
    const { data, error } = await supabase
      .from('product_distributions')
      .insert([distribution])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<ProductDistribution>): Promise<ProductDistribution> {
    const { data, error } = await supabase
      .from('product_distributions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getByCustomer(customerName: string): Promise<ProductDistribution[]> {
    const { data, error } = await supabase
      .from('product_distributions')
      .select(`
        *,
        manufacturing_batches(batch_number, manufacturing_date),
        inventory_lots(lot_number, item_id),
        inventory_items(name, sku)
      `)
      .ilike('customer_name', `%${customerName}%`)
      .order('shipment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
