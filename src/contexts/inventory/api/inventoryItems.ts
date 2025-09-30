import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '../types';

export const inventoryItemsApi = {
  async getAll(): Promise<InventoryItem[]> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) throw new Error('Not authenticated');

    // Get user's organization and role for team-based filtering
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.user.id)
      .single();

    if (userDataError || !userData) throw new Error('Could not get user data');

    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(*),
        base_unit:inventory_units(*),
        vendor:vendors(*),
        teams:team_id(name)
      `)
      .eq('is_active', true)
      .eq('organization_id', userData.organization_id);

    // Apply team-based filtering based on user role
    if (userData.role === 'admin' || userData.role === 'superadmin') {
      // Admins see all items in their organization (no additional filter needed)
    } else if (userData.role === 'manager') {
      // Managers see items from their managed teams + items available to all teams (team_id = null)
      const { data: managedTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('manager_id', user.user.id)
        .eq('organization_id', userData.organization_id);

      const teamIds = managedTeams?.map(t => t.id) || [];
      if (teamIds.length > 0) {
        query = query.or(`team_id.is.null,team_id.in.(${teamIds.join(',')})`);
      } else {
        query = query.is('team_id', null);
      }
    } else {
      // Other users see items from teams they belong to + items available to all teams
      const { data: userTeams } = await supabase
        .from('team_memberships')
        .select('team_id')
        .eq('user_id', user.user.id);

      const teamIds = userTeams?.map(tm => tm.team_id) || [];
      if (teamIds.length > 0) {
        query = query.or(`team_id.is.null,team_id.in.(${teamIds.join(',')})`);
      } else {
        query = query.is('team_id', null);
      }
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return (data || []) as any;
  },

  async create(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'category' | 'base_unit' | 'calculated_unit_price'>): Promise<InventoryItem> {
    // Add created_by field automatically for RLS policy compliance
    const itemWithCreatedBy = {
      ...item,
      barcode: item.barcode?.trim() || null,
      team_id: item.team_id || null, // Ensure team_id is properly handled
      image_url: item.image_url || null, // Ensure image_url is properly handled
      created_by: (await supabase.auth.getUser()).data.user?.id
    };

    console.log('🔄 Creating item with data:', itemWithCreatedBy);

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([itemWithCreatedBy])
      .select(`
        *,
        category:inventory_categories(*),
        base_unit:inventory_units(*),
        vendor:vendors(*),
        teams:team_id(name)
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
    const normalizedUpdates = {
      ...updates,
      ...(updates.barcode !== undefined && { barcode: updates.barcode?.trim() || null }),
      ...(updates.image_url !== undefined && { image_url: updates.image_url || null })
    };
    
    const { data, error } = await supabase
      .from('inventory_items')
      .update(normalizedUpdates)
      .eq('id', id)
      .select(`
        *,
        category:inventory_categories(*),
        base_unit:inventory_units(*),
        vendor:vendors(*),
        teams:team_id(name)
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
        base_unit:inventory_units(*),
        vendor:vendors(*),
        teams:team_id(name)
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
        base_unit:inventory_units(*),
        vendor:vendors(*),
        teams:team_id(name)
      `)
      .eq('barcode', barcode.trim())
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data as InventoryItem | null;
  },
};
