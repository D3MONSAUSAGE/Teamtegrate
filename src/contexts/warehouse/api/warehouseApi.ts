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
  wac_unit_cost: number;
  reorder_min?: number;
  reorder_max?: number;
  // Joined from inventory_items
  item?: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
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

export const warehouseApi = {
  // Get the primary warehouse for the organization
  async getPrimaryWarehouse(): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from('warehouses')
      .select(`
        *,
        team:teams(id, name)
      `)
      .eq('is_primary', true)
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

  // Create a new receipt
  async createReceipt(warehouseId: string, vendorName?: string): Promise<WarehouseReceipt> {
    const { data, error } = await supabase
      .from('warehouse_receipts')
      .insert({
        warehouse_id: warehouseId,
        vendor_name: vendorName,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return data as WarehouseReceipt;
  },

  // Add a line to a receipt
  async addReceiptLine(receiptId: string, line: {
    itemId: string;
    qty: number;
    unitCost: number;
  }): Promise<WarehouseReceiptLine> {
    const { data, error } = await supabase
      .from('warehouse_receipt_lines')
      .insert({
        receipt_id: receiptId,
        item_id: line.itemId,
        qty: line.qty,
        unit_cost: line.unitCost
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Post a receipt (finalize it)
  async postReceipt(receiptId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase.rpc('post_warehouse_receipt', {
      p_receipt_id: receiptId,
      p_user: user.user.id
    });

    if (error) throw error;
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

  // Ensure a primary warehouse exists (idempotent setup method)
  async ensurePrimaryWarehouse(name = 'Main Warehouse', teamId?: string): Promise<Warehouse> {
    try {
      // First try to get existing primary warehouse
      const existing = await this.getPrimaryWarehouse();
      if (existing) return existing;

      // If none exists, create one
      return await this.createDefaultWarehouse(name, teamId);
    } catch (error) {
      // Re-throw the error so UI can handle it appropriately
      throw error;
    }
  },

  // Search inventory items for warehouse receiving
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
  }
};