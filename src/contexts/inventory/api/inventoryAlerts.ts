import { supabase } from '@/integrations/supabase/client';
import { InventoryAlert } from '../types';

export const inventoryAlertsApi = {
  async getAll(): Promise<InventoryAlert[]> {
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select(`
        *,
        inventory_items(*)
      `)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as InventoryAlert[];
  },

  async resolve(alertId: string, resolvedBy: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', alertId);

    if (error) throw error;
  },

  async getByType(alertType: InventoryAlert['alert_type']): Promise<InventoryAlert[]> {
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select(`
        *,
        inventory_items(*)
      `)
      .eq('alert_type', alertType)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as InventoryAlert[];
  },

  async getByItemId(itemId: string): Promise<InventoryAlert[]> {
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select('*')
      .eq('item_id', itemId)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as InventoryAlert[];
  },
};