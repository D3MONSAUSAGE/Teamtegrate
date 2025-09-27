import { supabase } from '@/integrations/supabase/client';

export interface Shipment {
  id: string;
  organization_id: string;
  shipment_number: string;
  received_date: string;
  vendor_id?: string;
  supplier_info?: {
    name?: string;
    contact?: string;
    address?: string;
  };
  reference_number?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const shipmentsApi = {
  async getAll(): Promise<Shipment[]> {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('received_date', { ascending: false });

    if (error) throw error;
    return (data || []) as Shipment[];
  },

  async getById(id: string): Promise<Shipment> {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Shipment;
  },

  async create(shipment: Omit<Shipment, 'id' | 'created_at' | 'updated_at' | 'shipment_number'>): Promise<Shipment> {
    // Generate shipment number
    const { data: orgData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', shipment.created_by)
      .single();

    if (!orgData) throw new Error('Organization not found');

    const { data: shipmentNumber, error: numberError } = await supabase
      .rpc('generate_shipment_number', { org_id: orgData.organization_id });

    if (numberError) throw numberError;

    const shipmentData = {
      ...shipment,
      shipment_number: shipmentNumber,
    };

    const { data, error } = await supabase
      .from('shipments')
      .insert([shipmentData])
      .select()
      .single();

    if (error) throw error;
    return data as Shipment;
  },

  async update(id: string, updates: Partial<Shipment>): Promise<Shipment> {
    const { data, error } = await supabase
      .from('shipments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Shipment;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getRecentShipments(limit: number = 10): Promise<Shipment[]> {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('received_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Shipment[];
  },

  async getShipmentsByDate(date: string): Promise<Shipment[]> {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('received_date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Shipment[];
  }
};