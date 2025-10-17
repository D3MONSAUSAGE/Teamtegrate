import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '../types';

export const inventoryItemsApi = {
  async getAll(): Promise<InventoryItem[]> {
    // RLS policies now handle all filtering automatically
    // Users see only their team's items, admins see all items
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(*),
        base_unit:inventory_units(*),
        vendor:vendors(*),
        teams:team_id(name)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    console.log(`Loaded ${data?.length || 0} inventory items`);
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
    console.log('🔄 inventoryItemsApi.update called:', { id, updates });
    
    // SERVER-SIDE PROTECTION: Get current item and user info
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) throw new Error('Not authenticated');

    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.user.id)
      .single();

    if (userDataError || !userData) throw new Error('Could not get user data');

    // Get current item
    const { data: currentItem, error: itemError } = await supabase
      .from('inventory_items')
      .select('id, team_id, organization_id, name')
      .eq('id', id)
      .single();

    if (itemError || !currentItem) throw new Error('Item not found');

    console.log('🔒 Server-side security check:', {
      itemTeamId: currentItem.team_id,
      userRole: userData.role,
      userId: user.user.id
    });

    // CRITICAL: Prevent non-superadmins from updating global items
    const isGlobalItem = !currentItem.team_id;
    const isSuperAdmin = userData.role === 'superadmin';

    if (isGlobalItem && !isSuperAdmin) {
      console.error('🚫 SERVER SECURITY: Non-superadmin attempted to update global item', {
        userId: user.user.id,
        userRole: userData.role,
        itemId: id,
        itemName: currentItem.name
      });
      throw new Error('Access Denied: Global items can only be edited by superadmins');
    }

    // If item is team-specific, verify user belongs to that team
    if (currentItem.team_id && !isSuperAdmin) {
      const { data: membership } = await supabase
        .from('team_memberships')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('team_id', currentItem.team_id)
        .maybeSingle();

      if (!membership) {
        console.error('🚫 SERVER SECURITY: User not member of item team', {
          userId: user.user.id,
          itemTeamId: currentItem.team_id
        });
        throw new Error('Access Denied: You can only edit items from your own team');
      }
    }

    console.log('✅ Server-side security checks passed');
    
    console.log('📤 BEFORE normalization:', {
      updates,
      sku: updates.sku,
      skuType: typeof updates.sku,
      skuInUpdates: 'sku' in updates
    });

    const normalizedUpdates = {
      ...updates,
      ...(updates.sku !== undefined && { sku: updates.sku?.trim() || null }),
      ...(updates.barcode !== undefined && { barcode: updates.barcode?.trim() || null }),
      ...(updates.image_url !== undefined && { image_url: updates.image_url || null })
    };

    console.log('📤 AFTER normalization:', {
      normalizedUpdates,
      sku: normalizedUpdates.sku,
      skuType: typeof normalizedUpdates.sku,
      skuInNormalized: 'sku' in normalizedUpdates
    });
    
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
      
      // Handle SKU immutability - SKUs cannot be changed once assigned
      if (error.message?.includes('SKU cannot be modified')) {
        throw new Error('SKU cannot be changed once assigned to a product. SKUs are permanent identifiers.');
      }
      
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
    
    console.log('✅ Item updated successfully:', data.name);
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
