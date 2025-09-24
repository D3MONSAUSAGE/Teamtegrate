import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '../types';

export const inventoryItemsApi = {
  async getAll(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(*),
        base_unit:inventory_units(*)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []) as any;
  },

  async create(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'category' | 'base_unit' | 'calculated_unit_price'>): Promise<InventoryItem> {
    // Add created_by field automatically for RLS policy compliance
    const itemWithCreatedBy = {
      ...item,
      created_by: (await supabase.auth.getUser()).data.user?.id
    };

    console.log('🔄 Creating item with data:', itemWithCreatedBy);

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([itemWithCreatedBy])
      .select(`
        *,
        category:inventory_categories(*),
        base_unit:inventory_units(*)
      `)
      .single();

    if (error) {
      console.error('❌ Database error during item creation:', error);
      
      // Handle SKU uniqueness constraint
      if (error.code === '23505' && (error.message?.includes('sku') || error.message?.includes('ux_inventory_items_sku'))) {
        throw new Error(`SKU "${item.sku}" is already used by another item`);
      }
      
      // Handle barcode uniqueness constraint
      if (error.code === '23505' && (error.message?.includes('barcode') || error.message?.includes('ux_inventory_items_barcode'))) {
        throw new Error('That barcode is already used by another item');
      }
      
      // Handle other uniqueness constraints
      if (error.code === '23505') {
        throw new Error('This item conflicts with an existing item (duplicate SKU, barcode, or name)');
      }
      
      throw error;
    }
    
    console.log('✅ Item created successfully:', data);
    return data as any;
  },

  async update(id: string, updates: Partial<Omit<InventoryItem, 'category' | 'base_unit' | 'calculated_unit_price'>>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:inventory_categories(*),
        base_unit:inventory_units(*)
      `)
      .single();

    if (error) {
      console.error('❌ Database error during item update:', error);
      
      // Handle SKU uniqueness constraint
      if (error.code === '23505' && (error.message?.includes('sku') || error.message?.includes('ux_inventory_items_sku'))) {
        throw new Error(`SKU "${updates.sku}" is already used by another item`);
      }
      
      // Handle barcode uniqueness constraint
      if (error.code === '23505' && (error.message?.includes('barcode') || error.message?.includes('ux_inventory_items_barcode'))) {
        throw new Error('That barcode is already used by another item');
      }
      
      // Handle other uniqueness constraints
      if (error.code === '23505') {
        throw new Error('This item conflicts with an existing item (duplicate SKU, barcode, or name)');
      }
      
      throw error;
    }
    return data as any;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  async getById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(*),
        base_unit:inventory_units(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as any;
  },

  async updateStock(id: string, newStock: number): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', id);

    if (error) throw error;
  },

  async getByBarcode(barcode: string): Promise<InventoryItem | null> {
    if (!barcode?.trim()) return null;
    
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(*),
        base_unit:inventory_units(*)
      `)
      .eq('barcode', barcode.trim())
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data as InventoryItem | null;
  },
};