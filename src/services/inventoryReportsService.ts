import { supabase } from "@/integrations/supabase/client";

export interface InventoryValueSummary {
  team_id: string;
  team_name: string;
  total_value: number;
  item_count: number;
  low_stock_items: number;
  overstock_items: number;
}

export interface DailyMovement {
  transaction_type: string;
  transaction_count: number;
  total_quantity: number;
  total_value: number;
  po_numbers: string[];
}

export interface TransactionRecord {
  id: string;
  item_id: string;
  item_name: string;
  transaction_type: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  transaction_date: string;
  created_by: string;
  team_id: string;
  warehouse_id: string;
  notes?: string;
  organization_id: string;
}

export interface WeeklyMovement {
  week_start: string;
  team_id: string;
  team_name: string;
  transaction_type: string;
  transaction_count: number;
  total_quantity: number;
  total_value: number;
  po_number: string;
  vendor_name: string;
}

export interface MonthlyTeamPerformance {
  month_start: string;
  team_id: string;
  team_name: string;
  total_counts: number;
  avg_completion_rate: number;
  items_counted: number;
  total_variances: number;
  completed_counts: number;
  calculated_accuracy_percentage: number;
}

export interface VendorPerformance {
  vendor_id: string;
  vendor_name: string;
  items_supplied: number;
  avg_item_cost: number;
  total_inventory_value: number;
  total_transactions: number;
  last_transaction_date: string;
  teams_served: number;
}

export interface DailyInventorySummary {
  summary_date: string;
  team_id: string;
  team_name: string;
  total_items: number;
  total_inventory_value: number;
  total_stock_quantity: number;
  low_stock_items: number;
  overstock_items: number;
}

export const inventoryReportsService = {
  async getDailyMovements(organizationId: string, selectedDate: string, teamId?: string, warehouseId?: string): Promise<DailyMovement[]> {
    console.log('inventoryReportsService.getDailyMovements called with:', {
      organizationId,
      selectedDate,
      teamId,
      warehouseId
    });

    const { data, error } = await supabase.rpc('get_daily_movements', {
      p_organization_id: organizationId,
      p_date: selectedDate,
      p_team_id: teamId || null,
      p_warehouse_id: warehouseId || null
    });

    if (error) {
      console.error('Error fetching daily movements:', error);
      throw new Error(`Failed to fetch daily movements: ${error.message}`);
    }

    console.log('Daily movements data:', data);
    
    // Transform database results to match expected DailyMovement interface
    return (data || []).map((item: any) => ({
      transaction_type: item.transaction_type,
      transaction_count: Number(item.transaction_count) || 0,
      total_quantity: Number(item.total_quantity) || 0,
      total_value: Number(item.total_value) || 0,
      po_numbers: item.po_numbers || []
    }));
  },

  async getWarehouseDailyMovements(organizationId: string, warehouseId: string, selectedDate: string): Promise<DailyMovement[]> {
    console.log('inventoryReportsService.getWarehouseDailyMovements called with:', {
      organizationId,
      warehouseId,
      selectedDate
    });

    const { data, error } = await supabase.rpc('get_warehouse_daily_movements', {
      p_organization_id: organizationId,
      p_warehouse_id: warehouseId,
      p_date: selectedDate
    });

    if (error) {
      console.error('Error fetching warehouse daily movements:', error);
      throw new Error(`Failed to fetch warehouse daily movements: ${error.message}`);
    }

    console.log('Warehouse daily movements data:', data);
    
    // Transform database results to match expected DailyMovement interface
    return (data || []).map((item: any) => ({
      transaction_type: item.transaction_type,
      transaction_count: Number(item.transaction_count) || 0,
      total_quantity: Number(item.total_quantity) || 0,
      total_value: Number(item.total_value) || 0,
      po_numbers: item.po_numbers || []
    }));
  },

  async getRealTimeInventoryValue(organizationId: string, teamId?: string, warehouseId?: string): Promise<InventoryValueSummary[]> {
    console.log('inventoryReportsService.getRealTimeInventoryValue called with:', {
      organizationId,
      teamId,
      warehouseId
    });

    try {
      // If we have a warehouseId, use the warehouse-specific function
      if (warehouseId) {
        const { data, error } = await supabase.rpc('get_real_time_inventory_value', {
          p_warehouse_id: warehouseId
        }) as { data: any, error: any };

        if (error) {
          console.error('Error fetching warehouse inventory value:', error);
          throw new Error(`Failed to fetch warehouse inventory value: ${error.message}`);
        }

        console.log('Warehouse inventory value data:', data);
        
        // The function returns a JSONB object directly
        if (data && typeof data === 'object') {
          // Handle error case
          if (data.success === false) {
            console.error('Database function returned error:', data.error);
            throw new Error(`Database error: ${data.error || 'Unknown error'}`);
          }
          
          return [{
            team_id: warehouseId,
            team_name: `Warehouse ${warehouseId.substring(0, 8)}`,
            total_value: Number(data.total_value) || 0,
            item_count: Number(data.total_items) || 0,
            low_stock_items: Number(data.low_stock_items) || 0,
            overstock_items: Number(data.overstock_items) || 0
          }];
        }
      } else {
        // For team-based or organization-wide reporting, we need a different approach
        // For now, return a fallback with organization-wide data
        console.log('Team-based inventory reporting not yet implemented with warehouse schema');
        return [{
          team_id: teamId || 'all',
          team_name: teamId ? 'Selected Team' : 'All Teams',
          total_value: 0,
          item_count: 0,
          low_stock_items: 0,
          overstock_items: 0
        }];
      }

      return [];
    } catch (error) {
      console.error('Error in getRealTimeInventoryValue:', error);
      // Return empty data instead of throwing to prevent the UI from breaking
      return [{
        team_id: warehouseId || teamId || 'error',
        team_name: 'Error Loading Data',
        total_value: 0,
        item_count: 0,
        low_stock_items: 0,
        overstock_items: 0
      }];
    }
  },

  async getTeamInventorySummary(organizationId: string): Promise<InventoryValueSummary[]> {
    console.log('inventoryReportsService.getTeamInventorySummary called with:', {
      organizationId
    });

    const { data, error } = await supabase.rpc('get_team_inventory_summary', {
      p_organization_id: organizationId
    });

    if (error) {
      console.error('Error fetching team inventory summary:', error);
      throw new Error(`Failed to fetch team inventory summary: ${error.message}`);
    }

    console.log('Team inventory summary data:', data);
    
    // Transform database results to match expected InventoryValueSummary interface
    return (data || []).map((item: any) => ({
      team_id: item.team_id,
      team_name: item.team_name,
      total_value: Number(item.total_value) || 0,
      item_count: Number(item.total_items) || 0,
      low_stock_items: Number(item.low_stock_items) || 0,
      overstock_items: Number(item.out_of_stock_count) || 0
    }));
  },

  // Legacy functions for backward compatibility
  async getWarehouseInventoryValue(organizationId: string, warehouseId?: string): Promise<InventoryValueSummary[]> {
    // Use the real-time inventory value function with warehouse filtering
    return this.getRealTimeInventoryValue(organizationId, undefined, warehouseId);
  },

  async getWeeklyMovements(organizationId: string, startDate?: string, endDate?: string): Promise<WeeklyMovement[]> {
    // For now, return empty array - this would need a proper database function
    console.log('Weekly movements not yet implemented with new database functions');
    return [];
  },

  async getMonthlyTeamPerformance(organizationId: string, startDate?: string, endDate?: string): Promise<MonthlyTeamPerformance[]> {
    // For now, return empty array - this would need a proper database function
    console.log('Monthly team performance not yet implemented with new database functions');
    return [];
  },

  async getVendorPerformance(organizationId: string): Promise<VendorPerformance[]> {
    // For now, return empty array - this would need a proper database function
    console.log('Vendor performance not yet implemented with new database functions');
    return [];
  },

  async getDailySummary(organizationId: string, startDate?: string, endDate?: string): Promise<DailyInventorySummary[]> {
    // For now, return empty array - this would need a proper database function
    console.log('Daily summary not yet implemented with new database functions');
    return [];
  },

  // Helper function to get teams for the selector
  async getTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }
};