import { supabase } from '@/integrations/supabase/client';

export interface RecallNotice {
  id: string;
  organization_id: string;
  recall_number: string;
  lot_ids: string[];
  batch_ids?: string[];
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'initiated' | 'in_progress' | 'completed' | 'cancelled';
  affected_quantity: number;
  date_initiated: string;
  date_completed?: string;
  regulatory_agency?: string;
  action_required: string;
  contact_instructions?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RecallImpactAnalysis {
  total_affected_batches: number;
  total_affected_quantity: number;
  total_distributed_quantity: number;
  affected_customers: string[];
  distribution_details: Array<{
    customer_name: string;
    quantity_shipped: number;
    shipment_date: string;
    tracking_number?: string;
  }>;
}

export const recallNoticesApi = {
  async getAll(): Promise<RecallNotice[]> {
    const { data, error } = await supabase
      .from('recall_notices')
      .select('*')
      .order('date_initiated', { ascending: false });

    if (error) throw error;
    return (data || []) as RecallNotice[];
  },

  async getActive(): Promise<RecallNotice[]> {
    const { data, error } = await supabase
      .from('recall_notices')
      .select('*')
      .in('status', ['initiated', 'in_progress'])
      .order('date_initiated', { ascending: false });

    if (error) throw error;
    return (data || []) as RecallNotice[];
  },

  async create(recall: Omit<RecallNotice, 'id' | 'created_at' | 'updated_at'>): Promise<RecallNotice> {
    const { data, error } = await supabase
      .from('recall_notices')
      .insert([recall])
      .select()
      .single();

    if (error) throw error;
    return data as RecallNotice;
  },

  async update(id: string, updates: Partial<RecallNotice>): Promise<RecallNotice> {
    const { data, error } = await supabase
      .from('recall_notices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as RecallNotice;
  },

  async getImpactAnalysis(lotIds: string[]): Promise<RecallImpactAnalysis> {
    // Get all batches for these lots
    const { data: batches, error: batchError } = await supabase
      .from('manufacturing_batches')
      .select('*')
      .in('lot_id', lotIds);

    if (batchError) throw batchError;

    const batchIds = batches?.map(b => b.id) || [];
    
    // Get all distributions for these batches
    const { data: distributions, error: distError } = await supabase
      .from('product_distributions')
      .select('*')
      .in('batch_id', batchIds);

    if (distError) throw distError;

    const totalAffectedQuantity = batches?.reduce((sum, b) => sum + Number(b.total_quantity_manufactured), 0) || 0;
    const totalDistributedQuantity = distributions?.reduce((sum, d) => sum + Number(d.quantity_shipped), 0) || 0;
    const affectedCustomers = [...new Set(distributions?.map(d => d.customer_name) || [])];

    return {
      total_affected_batches: batches?.length || 0,
      total_affected_quantity: totalAffectedQuantity,
      total_distributed_quantity: totalDistributedQuantity,
      affected_customers: affectedCustomers,
      distribution_details: distributions?.map(d => ({
        customer_name: d.customer_name,
        quantity_shipped: Number(d.quantity_shipped),
        shipment_date: d.shipment_date,
        tracking_number: d.tracking_number
      })) || []
    };
  },

  async getBySeverity(severity: RecallNotice['severity']): Promise<RecallNotice[]> {
    const { data, error } = await supabase
      .from('recall_notices')
      .select('*')
      .eq('severity', severity)
      .order('date_initiated', { ascending: false });

    if (error) throw error;
    return (data || []) as RecallNotice[];
  }
};
