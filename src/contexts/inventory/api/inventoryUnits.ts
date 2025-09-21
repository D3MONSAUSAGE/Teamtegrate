import { supabase } from '@/integrations/supabase/client';
import { InventoryUnit } from '../types';

export const inventoryUnitsApi = {
  async getAll(): Promise<InventoryUnit[]> {
    const { data, error } = await supabase
      .from('inventory_units')
      .select('*')
      .eq('is_active', true)
      .order('unit_type, name');

    if (error) throw error;
    return (data || []) as InventoryUnit[];
  },

  async create(unit: Omit<InventoryUnit, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryUnit> {
    const { data, error } = await supabase
      .from('inventory_units')
      .insert([unit])
      .select()
      .single();

    if (error) throw error;
    return data as InventoryUnit;
  },

  async update(id: string, updates: Partial<InventoryUnit>): Promise<InventoryUnit> {
    const { data, error } = await supabase
      .from('inventory_units')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryUnit;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_units')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },
};