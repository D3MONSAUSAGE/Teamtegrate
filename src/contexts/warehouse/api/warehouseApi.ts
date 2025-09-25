import { supabase } from "@/integrations/supabase/client";

export type Warehouse = {
  id: string;
  name: string;
  is_primary: boolean;
  organization_id: string;
  address?: string;
  created_by?: string;
  created_at: string;
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
      .select('*')
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

    const { data, error } = await query.order('item.name');

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
  async createDefaultWarehouse(name: string, organizationId?: string): Promise<Warehouse> {
    const insertData: any = {
      name,
      is_primary: true
    };
    
    // Add organization_id if provided, otherwise let the database set it via RLS
    if (organizationId) {
      insertData.organization_id = organizationId;
    }

    const { data, error } = await supabase
      .from('warehouses')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};