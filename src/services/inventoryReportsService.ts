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
  async getRealTimeInventoryValue(teamId?: string): Promise<InventoryValueSummary[]> {
    console.log('📊 Fetching real-time inventory value for team:', teamId);
    
    try {
      const { data, error } = await supabase.rpc('get_real_time_inventory_value', {
        p_team_id: teamId || null
      });

      if (error) {
        console.error('❌ Error fetching real-time inventory value:', error);
        console.error('Error details:', { 
          message: error.message, 
          details: error.details, 
          hint: error.hint,
          code: error.code 
        });
        throw error;
      }

      console.log('✅ Raw inventory value data:', { 
        count: data?.length || 0, 
        sample: data?.[0] 
      });

      // Transform the detailed inventory data into team summaries
      if (!data || data.length === 0) {
        console.log('📦 No inventory data found');
        return [];
      }
      
      const teamSummaries = new Map<string, InventoryValueSummary>();
      
      data.forEach((item: any) => {
        const itemTeamId = item.team_id || 'no-team';
        
        if (!teamSummaries.has(itemTeamId)) {
          teamSummaries.set(itemTeamId, {
            team_id: itemTeamId,
            team_name: item.team_name || 'Unassigned',
            total_value: 0,
            total_items: 0,
            low_stock_count: 0,
            overstock_count: 0
          });
        }
        
        const summary = teamSummaries.get(itemTeamId)!;
        summary.total_value += Number(item.total_value) || 0;
        summary.total_items += 1;
        
        // Note: Stock level checking would need reorder_point and max_stock_level from inventory items
        // For now, we'll skip these calculations
      });
      
      const summaries = Array.from(teamSummaries.values());
      console.log('📈 Generated team summaries:', { 
        teamCount: summaries.length,
        totalValue: summaries.reduce((sum, s) => sum + s.total_value, 0) 
      });
      
      return summaries;
    } catch (error) {
      console.error('💥 Exception in getRealTimeInventoryValue:', error);
      return [];
    }
  },

  async getDailyMovements(date?: string, teamId?: string, warehouseId?: string): Promise<DailyMovement[]> {
    console.log('🏭 Fetching daily movements:', { date, teamId, warehouseId });
    
    try {
      const { data, error } = await supabase.rpc('get_daily_movements', {
        p_date: date || new Date().toISOString().split('T')[0],
        p_team_id: teamId || null,
        p_warehouse_id: warehouseId || null
      });

      if (error) {
        console.error('❌ Error fetching daily movements:', error);
        console.error('Error details:', { 
          message: error.message, 
          details: error.details, 
          hint: error.hint,
          code: error.code 
        });
        throw error;
      }

      console.log('✅ Daily movements data:', { 
        count: data?.length || 0, 
        sample: data?.[0] 
      });
      
      return data || [];
    } catch (error) {
      console.error('💥 Exception in getDailyMovements:', error);
      return [];
    }
  },

  // New warehouse-specific reporting functions
  async getWarehouseDailyMovements(warehouseId?: string, date?: string): Promise<DailyMovement[]> {
    console.log('🏢 Fetching warehouse daily movements:', { warehouseId, date });
    
    try {
      const { data, error } = await supabase.rpc('get_warehouse_daily_movements', {
        p_warehouse_id: warehouseId || null,
        p_date: date || new Date().toISOString().split('T')[0]
      });

      if (error) {
        console.error('❌ Error fetching warehouse daily movements:', error);
        console.error('Error details:', { 
          message: error.message, 
          details: error.details, 
          hint: error.hint,
          code: error.code 
        });
        throw error;
      }

      console.log('✅ Warehouse daily movements:', { 
        count: data?.length || 0, 
        warehouseId,
        date 
      });
      
      return data || [];
    } catch (error) {
      console.error('💥 Exception in getWarehouseDailyMovements:', error);
      return [];
    }
  },

  async getWarehouseInventoryValue(warehouseId?: string): Promise<any[]> {
    console.log('🏪 Fetching warehouse inventory value:', warehouseId);
    
    try {
      // Use the real-time inventory value function with warehouse filtering
      const { data, error } = await supabase.rpc('get_real_time_inventory_value', {
        p_team_id: null
      });

      if (error) {
        console.error('❌ Error fetching warehouse inventory value:', error);
        console.error('Error details:', { 
          message: error.message, 
          details: error.details, 
          hint: error.hint,
          code: error.code 
        });
        throw error;
      }

      // Filter by warehouse if specified
      let filteredData = data || [];
      if (warehouseId) {
        filteredData = filteredData.filter((item: any) => 
          item.warehouse_id && item.warehouse_id.toString() === warehouseId
        );
      }

      console.log('✅ Warehouse inventory value:', { 
        totalCount: data?.length || 0,
        filteredCount: filteredData.length, 
        warehouseId 
      });
      
      return filteredData;
    } catch (error) {
      console.error('💥 Exception in getWarehouseInventoryValue:', error);
      return [];
    }
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