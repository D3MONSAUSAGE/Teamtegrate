import { supabase } from "@/integrations/supabase/client";

export interface InventoryValueSummary {
  team_id: string;
  team_name: string;
  total_value: number;
  total_items: number;
  low_stock_count: number;
  overstock_count: number;
}

export interface DailyMovement {
  transaction_type: string;
  transaction_count: number;
  total_quantity: number;
  total_value: number;
  po_numbers: string[];
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
  async getRealTimeInventoryValue(teamId?: string): Promise<InventoryValueSummary[]> {
    const { data, error } = await supabase.rpc('get_real_time_inventory_value', {
      team_id_param: teamId || null
    });
    
    if (error) throw error;
    
    // Transform the detailed inventory data into team summaries
    if (!data || data.length === 0) return [];
    
    const teamSummaries = new Map<string, InventoryValueSummary>();
    
    data.forEach((item: any) => {
      const teamId = item.team_id;
      
      if (!teamSummaries.has(teamId)) {
        teamSummaries.set(teamId, {
          team_id: teamId,
          team_name: item.team_name,
          total_value: 0,
          total_items: 0,
          low_stock_count: 0,
          overstock_count: 0
        });
      }
      
      const summary = teamSummaries.get(teamId)!;
      summary.total_value += Number(item.total_value);
      summary.total_items += 1;
      
      // Check if item is low stock or overstock
      if (item.current_stock <= item.reorder_point) {
        summary.low_stock_count += 1;
      }
      if (item.current_stock >= item.max_stock_level) {
        summary.overstock_count += 1;
      }
    });
    
    return Array.from(teamSummaries.values());
  },

  async getDailyMovements(date?: string, teamId?: string, warehouseId?: string): Promise<DailyMovement[]> {
    const { data, error } = await supabase.rpc('get_daily_movements', {
      p_date: date || new Date().toISOString().split('T')[0],
      p_team_id: teamId || null,
      p_warehouse_id: warehouseId || null
    });
    
    if (error) throw error;
    return data || [];
  },

  // New warehouse-specific reporting functions
  async getWarehouseDailyMovements(warehouseId?: string, date?: string): Promise<DailyMovement[]> {
    const { data, error } = await supabase.rpc('get_warehouse_daily_movements', {
      p_warehouse_id: warehouseId || null,
      p_date: date || new Date().toISOString().split('T')[0]
    });
    
    if (error) throw error;
    return data || [];
  },

  async getWarehouseInventoryValue(warehouseId?: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_warehouse_inventory_value', {
      p_warehouse_id: warehouseId || null
    });
    
    if (error) throw error;
    return data || [];
  },

  async getWeeklyMovements(startDate?: string, endDate?: string): Promise<WeeklyMovement[]> {
    let query = supabase
      .from('weekly_inventory_movements')
      .select('*')
      .order('week_start', { ascending: false });

    if (startDate) {
      query = query.gte('week_start', startDate);
    }
    if (endDate) {
      query = query.lte('week_start', endDate);
    }

    const { data, error } = await query.limit(100);
    
    if (error) throw error;
    return data || [];
  },

  async getMonthlyTeamPerformance(startDate?: string, endDate?: string): Promise<MonthlyTeamPerformance[]> {
    let query = supabase
      .from('monthly_team_performance')
      .select('*')
      .order('month_start', { ascending: false });

    if (startDate) {
      query = query.gte('month_start', startDate);
    }
    if (endDate) {
      query = query.lte('month_start', endDate);
    }

    const { data, error } = await query.limit(50);
    
    if (error) throw error;
    return data || [];
  },

  async getVendorPerformance(): Promise<VendorPerformance[]> {
    const { data, error } = await supabase
      .from('vendor_performance_analytics')
      .select('*')
      .order('total_inventory_value', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  },

  async getDailySummary(startDate?: string, endDate?: string): Promise<DailyInventorySummary[]> {
    let query = supabase
      .from('daily_inventory_summary')
      .select('*')
      .order('summary_date', { ascending: false });

    if (startDate) {
      query = query.gte('summary_date', startDate);
    }
    if (endDate) {
      query = query.lte('summary_date', endDate);
    }

    const { data, error } = await query.limit(100);
    
    if (error) throw error;
    return data || [];
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