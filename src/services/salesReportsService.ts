import { supabase } from "@/integrations/supabase/client";

export interface SalesTransaction {
  id: string;
  transaction_date: string;
  team_id: string;
  team_name?: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_cost: number;
  total_revenue: number;
  profit: number;
  reference_number: string;
}

export interface TeamSalesData {
  team_id: string;
  team_name: string;
  total_revenue: number;
  total_profit: number;
  total_transactions: number;
  profit_margin: number;
}

export interface SalesMetrics {
  totalSalesRevenue: number;
  totalSalesTransactions: number;
  totalProfit: number;
  profitMargin: number;
}

export const salesReportsService = {
  /**
   * Get sales transactions for a specific date range
   */
  async getSalesTransactions(
    startDate: string, 
    endDate: string, 
    teamId?: string
  ): Promise<SalesTransaction[]> {
    let query = supabase
      .from('inventory_transactions')
      .select(`
        id,
        transaction_date,
        team_id,
        item_id,
        quantity,
        unit_cost,
        reference_number,
        inventory_items(name),
        teams(name)
      `)
      .eq('transaction_type', 'out')
      .like('reference_number', 'SALE%')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sales transactions:', error);
      throw error;
    }

    return (data || []).map(transaction => ({
      id: transaction.id,
      transaction_date: transaction.transaction_date,
      team_id: transaction.team_id,
      team_name: (transaction.teams as any)?.name || 'Unknown Team',
      item_id: transaction.item_id,
      item_name: (transaction.inventory_items as any)?.name || 'Unknown Item',
      quantity: Math.abs(transaction.quantity), // Convert negative quantity to positive
      unit_cost: transaction.unit_cost,
      total_revenue: Math.abs(transaction.quantity) * transaction.unit_cost,
      profit: 0, // Will be calculated with cost data
      reference_number: transaction.reference_number,
    }));
  },

  /**
   * Get aggregated sales data by team
   */
  async getTeamSalesData(
    startDate: string, 
    endDate: string
  ): Promise<TeamSalesData[]> {
    // Use manual calculation since RPC doesn't exist yet
    return this.calculateTeamSalesDataFallback(startDate, endDate);
  },

  /**
   * Fallback method to calculate team sales data manually
   */
  async calculateTeamSalesDataFallback(
    startDate: string, 
    endDate: string
  ): Promise<TeamSalesData[]> {
    const transactions = await this.getSalesTransactions(startDate, endDate);
    
    const teamMap = new Map<string, TeamSalesData>();

    transactions.forEach(transaction => {
      if (!transaction.team_id) return;

      const existing = teamMap.get(transaction.team_id);
      if (existing) {
        existing.total_revenue += transaction.total_revenue;
        existing.total_profit += transaction.profit;
        existing.total_transactions += 1;
      } else {
        teamMap.set(transaction.team_id, {
          team_id: transaction.team_id,
          team_name: transaction.team_name || 'Unknown Team',
          total_revenue: transaction.total_revenue,
          total_profit: transaction.profit,
          total_transactions: 1,
          profit_margin: 0, // Will be calculated below
        });
      }
    });

    // Calculate profit margins
    const result = Array.from(teamMap.values()).map(team => ({
      ...team,
      profit_margin: team.total_revenue > 0 ? (team.total_profit / team.total_revenue) * 100 : 0,
    }));

    return result.sort((a, b) => b.total_revenue - a.total_revenue);
  },

  /**
   * Get overall sales metrics
   */
  async getSalesMetrics(
    startDate: string, 
    endDate: string, 
    teamId?: string
  ): Promise<SalesMetrics> {
    const transactions = await this.getSalesTransactions(startDate, endDate, teamId);

    const totalSalesRevenue = transactions.reduce((sum, t) => sum + t.total_revenue, 0);
    const totalProfit = transactions.reduce((sum, t) => sum + t.profit, 0);
    const totalSalesTransactions = transactions.length;
    const profitMargin = totalSalesRevenue > 0 ? (totalProfit / totalSalesRevenue) * 100 : 0;

    return {
      totalSalesRevenue,
      totalSalesTransactions,
      totalProfit,
      profitMargin,
    };
  },

  /**
   * Get sales data for a specific date (used for daily reports)
   */
  async getDailySalesData(date: string, teamId?: string) {
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    return this.getSalesTransactions(startDate, endDate, teamId);
  },
};