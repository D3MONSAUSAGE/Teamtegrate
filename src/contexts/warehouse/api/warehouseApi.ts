import { supabase } from "@/integrations/supabase/client";

export type Warehouse = {
  id: string;
  name: string;
  is_primary: boolean;
  organization_id: string;
  team_id?: string;
  address?: string;
  created_by?: string;
  created_at: string;
  // Joined data
  team?: {
    id: string;
    name: string;
  };
};

export type WarehouseItem = {
  warehouse_id: string;
  item_id: string;
  on_hand: number;
  reorder_min?: number;
  reorder_max?: number;
  sale_price?: number;
  // Joined from inventory_items
  item?: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    unit_cost?: number;
    sale_price?: number;
    category?: {
      name: string;
    };
    base_unit?: {
      name: string;
      abbreviation: string;
    };
  };
};

export type WarehouseReceipt = {
  id: string;
  warehouse_id: string;
  vendor_name?: string;
  vendor_invoice?: string;
  received_at?: string;
  status: 'draft' | 'posted' | 'cancelled';
  subtotal?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
};

export type WarehouseReceiptLine = {
  id: string;
  receipt_id: string;
  item_id: string;
  qty: number;
  unit_cost: number;
  line_total: number;
};

export type WarehouseTransfer = {
  id: string;
  warehouse_id: string;
  to_team_id: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  transfer_no?: string;
  sent_at?: string;
  received_at?: string;
  created_by?: string;
  created_at: string;
  notes?: string;
  charge_subtotal: number;
  // Joined data
  team?: {
    name: string;
  };
};

export type WarehouseTransferLine = {
  id: string;
  transfer_id: string;
  item_id: string;
  qty: number;
  unit_price: number;
  line_total: number;
};

export type RecentTransfer = {
  team_id: string;
  transfer_id: string;
  status: string;
  sent_at?: string;
  item_id: string;
  qty: number;
  unit_price: number;
};

export type WarehouseOverview = {
  warehouse_id: string;
  warehouse_name: string;
  team_id: string | null;
  team_name: string;
  total_items: number;
  total_inventory_value: number;
  low_stock_count: number;
  created_at: string;
  address?: string;
};

export type DailyMetrics = {
  receipts_count: number;
  receipts_value: number;
  transfers_count: number;
  transfers_value: number;
  date: string;
};

export type WarehouseReceiveStockResponse = {
  success: boolean;
  error?: string;
  item_existed?: boolean;
  new_stock_level?: number;
  quantity_added?: number;
};

export const warehouseApi = {
  // Get warehouse by team ID
  async getWarehouseByTeam(teamId: string): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from('warehouses')
      .select(`
        *,
        team:teams(id, name)
      `)
      .eq('team_id', teamId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data;
  },

  // List all warehouses for admin/superadmin users
  async listWarehouses(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from('warehouses')
      .select(`
        *,
        team:teams(id, name)
      `)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // List warehouse items with inventory item details
  async listWarehouseItems(warehouseId: string, search?: string): Promise<WarehouseItem[]> {
    let query = supabase
      .from('warehouse_items')
      .select(`
        *,
        item:inventory_items(
          id,
          name,
          sku,
          barcode,
          unit_cost,
          sale_price,
          category:inventory_categories(name),
          base_unit:inventory_units(name, abbreviation)
        )
      `)
      .eq('warehouse_id', warehouseId);

    if (search && search.trim()) {
      query = query.or(`item.name.ilike.%${search}%,item.sku.ilike.%${search}%,item.barcode.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  // Receive stock using database function
  async receiveStock(warehouseId: string, items: Array<{
    item_id: string;
    quantity: number;
    unit_cost: number;
    notes?: string;
    lot_number?: string;
    expiration_date?: string;
    manufacturing_date?: string;
    vendor_id?: string;
    invoice_number?: string;
  }>): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🏭 warehouseApi.receiveStock: Starting to receive', items.length, 'items for warehouse', warehouseId);
      
      // Call the warehouse_receive_stock database function for each item
      for (const item of items) {
        console.log('🏭 warehouseApi.receiveStock: Processing item', item.item_id, 'qty:', item.quantity);
        
        const { data, error } = await supabase.rpc('warehouse_receive_stock', {
          p_item_id: item.item_id,
          p_quantity: item.quantity,
          p_warehouse_id: warehouseId,
          p_unit_cost: item.unit_cost || 0,
          p_lot_number: item.lot_number || null,
          p_vendor_id: item.vendor_id || null,
          p_invoice_number: item.invoice_number || null
        });

        console.log('🏭 warehouseApi.receiveStock: RPC response for item', item.item_id, '- data:', data, 'error:', error);

        // Check for RPC-level errors first
        if (error) {
          console.error('🏭 warehouseApi.receiveStock: RPC error for item', item.item_id, ':', error);
          throw new Error(`RPC Error for item ${item.item_id}: ${error.message}`);
        }

        // Check the actual function response (data contains the JSONB response)
        const responseData = data as WarehouseReceiveStockResponse;
        if (responseData && !responseData.success) {
          console.error('🏭 warehouseApi.receiveStock: Function returned error for item', item.item_id, ':', responseData.error);
          throw new Error(`Failed to receive item ${item.item_id}: ${responseData.error}`);
        }

        console.log('🏭 warehouseApi.receiveStock: Successfully processed item', item.item_id, 'new stock level:', responseData?.new_stock_level);
      }

      console.log('🏭 warehouseApi.receiveStock: Successfully received all', items.length, 'items');
      
      // Create incoming transaction records for audit trail
      console.log('🏭 warehouseApi.receiveStock: Creating incoming transactions for audit trail');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.warn('⚠️ No authenticated user found for transaction tracking');
      } else {
        const transactionRecords = items.map(item => ({
          organization_id: null, // Will be set by trigger
          user_id: authUser.id,
          warehouse_id: warehouseId,
          item_id: item.item_id,
          transaction_type: 'in',
          quantity: item.quantity,
          unit_cost: item.unit_cost || 0,
          transaction_date: new Date().toISOString(),
          reference_number: item.invoice_number || `RCPT-${Date.now()}`,
          processed_by: authUser.id,
          notes: item.notes || 'Warehouse stock receipt'
        }));

        const { error: txError } = await supabase
          .from('inventory_transactions')
          .insert(transactionRecords);
        
        if (txError) {
          console.error('❌ Failed to create incoming transactions:', txError);
        } else {
          console.log('✅ Created', items.length, 'incoming transaction records');
        }
      }
      
      return { 
        success: true, 
        message: `Successfully received ${items.length} items` 
      };
    } catch (error) {
      console.error('🏭 warehouseApi.receiveStock: Error receiving stock:', error);
      throw error;
    }
  },

  // Create a new transfer
  async createTransfer(
    warehouseId: string, 
    toTeamId: string, 
    payload?: { transferNo?: string; notes?: string }
  ): Promise<WarehouseTransfer> {
    const { data, error } = await supabase
      .from('warehouse_transfers')
      .insert({
        warehouse_id: warehouseId,
        to_team_id: toTeamId,
        transfer_no: payload?.transferNo,
        notes: payload?.notes,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return data as WarehouseTransfer;
  },

  // Add a line to a transfer
  async addTransferLine(transferId: string, line: {
    itemId: string;
    qty: number;
    unitPrice?: number;
  }): Promise<WarehouseTransferLine> {
    const { data, error } = await supabase
      .from('warehouse_transfer_lines')
      .insert({
        transfer_id: transferId,
        item_id: line.itemId,
        qty: line.qty,
        unit_price: line.unitPrice || 0 // Will be set to WAC when sent if 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Send a transfer (finalize it)
  async sendTransfer(transferId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase.rpc('send_warehouse_transfer', {
      p_transfer_id: transferId,
      p_user: user.user.id
    });

    if (error) throw error;
  },

  // Receive a transfer
  async receiveTransfer(transferId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase.rpc('receive_warehouse_transfer', {
      p_transfer_id: transferId,
      p_user: user.user.id
    });

    if (error) throw error;
  },

  // Get recent transfers for a team
  async listRecentTransfersForTeam(teamId: string, sinceISO?: string): Promise<RecentTransfer[]> {
    let query = supabase
      .from('v_team_recent_transfers')
      .select('*')
      .eq('team_id', teamId);

    if (sinceISO) {
      query = query.gte('sent_at', sinceISO);
    }

    const { data, error } = await query
      .order('sent_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  // Create a default warehouse for an organization (used for first-time setup)
  async createDefaultWarehouse(name: string, teamId?: string): Promise<Warehouse> {
    // Must be authenticated
    const { data: authRes } = await supabase.auth.getUser();
    const uid = authRes?.user?.id;
    if (!uid) throw new Error('You must be signed in to set up a warehouse.');

    // Fetch user's organization (required for RLS policy)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', uid)
      .single();

    if (userError || !userData?.organization_id) {
      throw new Error('Could not determine your organization.');
    }

    // Insert with explicit organization_id and team_id (RLS WITH CHECK will pass)
    const { data, error } = await supabase
      .from('warehouses')
      .insert({
        name,
        is_primary: true,
        organization_id: userData.organization_id,
        team_id: teamId,
        created_by: uid,
      })
      .select(`
        *,
        team:teams(id, name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a team-specific warehouse (non-primary)
  async createTeamWarehouse(name: string, teamId: string): Promise<Warehouse> {
    // Must be authenticated
    const { data: authRes } = await supabase.auth.getUser();
    const uid = authRes?.user?.id;
    if (!uid) throw new Error('You must be signed in to set up a warehouse.');

    // Fetch user's organization (required for RLS policy)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', uid)
      .single();

    if (userError || !userData?.organization_id) {
      throw new Error('Could not determine your organization.');
    }

    // Check if team warehouse already exists
    const existing = await this.getWarehouseByTeam(teamId);
    if (existing) {
      return existing;
    }

    // Insert with is_primary: false for team warehouses
    const { data, error } = await supabase
      .from('warehouses')
      .insert({
        name,
        is_primary: false, // Team warehouses are NOT primary
        organization_id: userData.organization_id,
        team_id: teamId,
        created_by: uid,
      })
      .select(`
        *,
        team:teams(id, name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Ensure a primary warehouse exists (idempotent setup method)
  async ensurePrimaryWarehouse(name = 'Main Warehouse', teamId?: string): Promise<Warehouse> {
    try {
      // First try to get existing warehouse by team if teamId is provided
      if (teamId) {
        const existing = await this.getWarehouseByTeam(teamId);
        if (existing) return existing;
      }

      // If none exists, create one
      return await this.createDefaultWarehouse(name, teamId);
    } catch (error) {
      // Re-throw the error so UI can handle it appropriately
      throw error;
    }
  },

  // Update warehouse stock levels  
  async updateWarehouseStock(warehouseId: string, itemId: string, quantityChange: number): Promise<boolean> {
    // First get current stock to validate the operation
    const { data: currentItem, error: fetchError } = await supabase
      .from('warehouse_items')
      .select('on_hand')
      .eq('warehouse_id', warehouseId)
      .eq('item_id', itemId)
      .single();

    if (fetchError) {
      console.error('Error fetching current stock:', fetchError);
      throw new Error(`Failed to fetch current stock: ${fetchError.message}`);
    }

    const newStock = Math.max(0, currentItem.on_hand + quantityChange);
    
    // Prevent negative stock
    if (quantityChange < 0 && Math.abs(quantityChange) > currentItem.on_hand) {
      throw new Error(`Insufficient stock: trying to withdraw ${Math.abs(quantityChange)} but only ${currentItem.on_hand} available`);
    }

    const { data, error } = await supabase
      .from('warehouse_items')
      .update({
        on_hand: newStock
      })
      .eq('warehouse_id', warehouseId)
      .eq('item_id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Warehouse stock update error:', error);
      throw new Error(`Failed to update warehouse stock: ${error.message}`);
    }

    return !!data;
  },

  // Bulk update warehouse stock (for multiple items at once)
  async bulkUpdateWarehouseStock(updates: Array<{ warehouseId: string; itemId: string; quantityChange: number }>): Promise<void> {
    const promises = updates.map(update => 
      this.updateWarehouseStock(update.warehouseId, update.itemId, update.quantityChange)
    );
    
    await Promise.all(promises);
  },

  // Get warehouse overview for admin dashboard
  async getWarehouseOverview(): Promise<WarehouseOverview[]> {
    try {
      // Calculate manually since warehouse_overview view doesn't exist
      const warehouses = await this.listWarehouses();
      const overview: WarehouseOverview[] = [];
      
      for (const warehouse of warehouses) {
        const items = await this.listWarehouseItems(warehouse.id);
        const totalValue = items.reduce((sum, item) => sum + (item.on_hand * (item.item?.unit_cost || 0)), 0);
        const lowStockCount = items.filter(item => 
          item.reorder_min && item.on_hand <= item.reorder_min
        ).length;
        
        overview.push({
          warehouse_id: warehouse.id,
          warehouse_name: warehouse.name,
          team_id: warehouse.team_id,
          team_name: warehouse.team?.name || 'Main Warehouse',
          total_items: items.length,
          total_inventory_value: totalValue,
          low_stock_count: lowStockCount,
          created_at: warehouse.created_at,
          address: warehouse.address
        });
      }
      
      return overview;
    } catch (error) {
      console.error('Error getting warehouse overview:', error);
      return [];
    }
  },

  // Get daily metrics for warehouse dashboard
  async getDailyMetrics(date = new Date().toISOString().split('T')[0]): Promise<DailyMetrics> {
    // TODO: Implement once warehouse_receipts and warehouse_transfers tables are created
    return {
      receipts_count: 0,
      receipts_value: 0,
      transfers_count: 0,
      transfers_value: 0,
      date
    };
  },

  // Search inventory items for warehouse receiving (organization-wide)
  async searchInventoryItems(query: string, limit = 20): Promise<any[]> {
    if (!query.trim()) return [];

    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) throw new Error('Not authenticated');

    // Get user's organization for filtering
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.user.id)
      .single();

    if (userDataError || !userData) throw new Error('Could not get user data');

    let baseQuery = supabase
      .from('inventory_items')
      .select(`
        id,
        name,
        sku,
        barcode,
        unit_cost,
        team_id,
        category:inventory_categories(name),
        base_unit:inventory_units(name, abbreviation)
      `)
      .eq('is_active', true)
      .eq('organization_id', userData.organization_id)
      .limit(limit);

    // Apply team-based filtering for managers (same logic as getAll)
    if (userData.role === 'manager') {
      const { data: managedTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('manager_id', user.user.id)
        .eq('organization_id', userData.organization_id);

      const teamIds = managedTeams?.map(t => t.id) || [];
      if (teamIds.length > 0) {
        baseQuery = baseQuery.or(`team_id.is.null,team_id.in.(${teamIds.join(',')})`);
      } else {
        baseQuery = baseQuery.is('team_id', null);
      }
    } else if (userData.role !== 'admin' && userData.role !== 'superadmin') {
      // Other users see items from teams they belong to + items available to all teams
      const { data: userTeams } = await supabase
        .from('team_memberships')
        .select('team_id')
        .eq('user_id', user.user.id);

      const teamIds = userTeams?.map(tm => tm.team_id) || [];
      if (teamIds.length > 0) {
        baseQuery = baseQuery.or(`team_id.is.null,team_id.in.(${teamIds.join(',')})`);
      } else {
        baseQuery = baseQuery.is('team_id', null);
      }
    }

    // Search by name, SKU, or barcode
    const searchTerm = query.trim();
    
    // If it looks like a barcode (numbers only, 6+ digits), prioritize barcode search
    if (/^\d{6,}$/.test(searchTerm)) {
      baseQuery = baseQuery.or(`barcode.eq.${searchTerm},name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
    } else {
      baseQuery = baseQuery.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
    }

    const { data, error } = await baseQuery.order('name');

    if (error) throw error;
    return data || [];
  },

  // Search warehouse items (warehouse-specific stock only) - LEGACY
  async searchWarehouseItems(warehouseId: string, query: string, limit = 20): Promise<any[]> {
    if (!query.trim() || !warehouseId) return [];

    const searchTerm = query.trim();
    
    let baseQuery = supabase
      .from('warehouse_items')
      .select(`
        warehouse_id,
        item_id,
        on_hand,
        sale_price,
        reorder_min,
        reorder_max,
        item:inventory_items(
          id,
          name,
          sku,
          barcode,
          unit_cost,
          sale_price,
          category:inventory_categories(name),
          base_unit:inventory_units(name, abbreviation)
        )
      `)
      .eq('warehouse_id', warehouseId)
      .gt('on_hand', 0) // Only items with stock available
      .limit(limit);

    // Search by name, SKU, or barcode through joined inventory_items
    if (/^\d{6,}$/.test(searchTerm)) {
      // If it looks like a barcode (numbers only, 6+ digits), prioritize barcode search
      baseQuery = baseQuery.or(`item.barcode.eq.${searchTerm},item.name.ilike.%${searchTerm}%,item.sku.ilike.%${searchTerm}%`);
    } else {
      baseQuery = baseQuery.or(`item.name.ilike.%${searchTerm}%,item.sku.ilike.%${searchTerm}%,item.barcode.ilike.%${searchTerm}%`);
    }

    const { data, error } = await baseQuery.order('item.name');

    if (error) throw error;
    
    // Transform to match expected InventoryItem interface for search results
    return (data || []).map(warehouseItem => ({
      id: warehouseItem.item_id,
      name: warehouseItem.item?.name || '',
      sku: warehouseItem.item?.sku,
      barcode: warehouseItem.item?.barcode,
      unit_cost: warehouseItem.item?.unit_cost || 0,
      sale_price: warehouseItem.sale_price || warehouseItem.item?.sale_price || 0,
      on_hand: warehouseItem.on_hand, // Include warehouse stock level
      category: warehouseItem.item?.category,
      base_unit: warehouseItem.item?.base_unit
    }));
  },

  // Search ALL inventory items with warehouse stock status (HYBRID APPROACH)
  async searchAllInventoryItemsWithStock(warehouseId: string, query: string, limit = 20): Promise<any[]> {
    if (!query.trim() || !warehouseId) return [];

    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) throw new Error('Not authenticated');

    // Get user's organization for filtering
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.user.id)
      .single();

    if (userDataError || !userData) throw new Error('Could not get user data');

    const searchTerm = query.trim();

    // First get all matching inventory items
    let baseQuery = supabase
      .from('inventory_items')
      .select(`
        id,
        name,
        sku,
        barcode,
        unit_cost,
        sale_price,
        team_id,
        category:inventory_categories(name),
        base_unit:inventory_units(name, abbreviation)
      `)
      .eq('is_active', true)
      .eq('organization_id', userData.organization_id)
      .limit(limit);

    // Apply team-based filtering (same as searchInventoryItems)
    if (userData.role === 'manager') {
      const { data: managedTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('manager_id', user.user.id)
        .eq('organization_id', userData.organization_id);

      const teamIds = managedTeams?.map(t => t.id) || [];
      if (teamIds.length > 0) {
        baseQuery = baseQuery.or(`team_id.is.null,team_id.in.(${teamIds.join(',')})`);
      } else {
        baseQuery = baseQuery.is('team_id', null);
      }
    } else if (userData.role !== 'admin' && userData.role !== 'superadmin') {
      const { data: userTeams } = await supabase
        .from('team_memberships')
        .select('team_id')
        .eq('user_id', user.user.id);

      const teamIds = userTeams?.map(tm => tm.team_id) || [];
      if (teamIds.length > 0) {
        baseQuery = baseQuery.or(`team_id.is.null,team_id.in.(${teamIds.join(',')})`);
      } else {
        baseQuery = baseQuery.is('team_id', null);
      }
    }

    // Search by name, SKU, or barcode
    if (/^\d{6,}$/.test(searchTerm)) {
      baseQuery = baseQuery.or(`barcode.eq.${searchTerm},name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
    } else {
      baseQuery = baseQuery.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
    }

    const { data: inventoryItems, error: invError } = await baseQuery.order('name');
    if (invError) throw invError;

    if (!inventoryItems?.length) return [];

    // Get warehouse stock for all these items
    const itemIds = inventoryItems.map(item => item.id);
    const { data: warehouseStockData, error: stockError } = await supabase
      .from('warehouse_items')
      .select('item_id, on_hand, sale_price')
      .eq('warehouse_id', warehouseId)
      .in('item_id', itemIds);

    if (stockError) throw stockError;

    // Create lookup map for warehouse stock
    const stockMap = new Map(
      (warehouseStockData || []).map(item => [item.item_id, item])
    );

    // Combine inventory items with warehouse stock status
    return inventoryItems.map(item => {
      const warehouseStock = stockMap.get(item.id);
      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        unit_cost: item.unit_cost || 0,
        sale_price: warehouseStock?.sale_price || item.sale_price || 0,
        on_hand: warehouseStock?.on_hand || 0, // Default to 0 if not in warehouse
        category: item.category,
        base_unit: item.base_unit,
        // Add stock status flags
        stock_status: warehouseStock?.on_hand > 0 ? 'available' : 'unavailable',
        is_in_warehouse: !!warehouseStock
      };
    });
  }
};