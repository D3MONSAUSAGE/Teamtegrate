import { supabase } from '@/integrations/supabase/client';
import { SalesData } from '@/types/sales';
import { toast } from '@/components/ui/sonner';

export interface SalesDataFilters {
  organization_id?: string;
  user_id?: string;
  location?: string;
  team_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface SalesDataStats {
  total_records: number;
  unique_locations: string[];
  date_range: {
    earliest: string;
    latest: string;
  };
}

class SalesDataService {
  private static instance: SalesDataService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SalesDataService {
    if (!SalesDataService.instance) {
      SalesDataService.instance = new SalesDataService();
    }
    return SalesDataService.instance;
  }

  private getCacheKey(filters: SalesDataFilters): string {
    return JSON.stringify(filters);
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private clearCache(): void {
    this.cache.clear();
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id, name, email')
      .eq('id', user.id)
      .single();
    
    if (!profile) throw new Error('User profile not found');
    return { ...user, ...profile };
  }

  async fetchSalesData(filters: SalesDataFilters = {}): Promise<SalesData[]> {
    const cacheKey = this.getCacheKey(filters);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isValidCache(cached.timestamp)) {
      console.log('[SalesDataService] Returning cached data');
      return cached.data;
    }

    try {
      const user = await this.getCurrentUser();
      
      let query = supabase
        .from('sales_data')
        .select('*')
        .eq('organization_id', user.organization_id)
        .order('date', { ascending: false });

      // Apply additional filters
      if (filters.location && filters.location !== 'all') {
        query = query.eq('location', filters.location);
      }

      if (filters.team_id) {
        query = query.eq('team_id', filters.team_id);
      }
      
      if (filters.date_from) {
        query = query.gte('date', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.lte('date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[SalesDataService] Fetch error:', error);
        throw new Error(`Failed to fetch sales data: ${error.message}`);
      }

      const salesData = (data || []).map(item => {
        const rawData = (item.raw_data as any) || {};
        return {
          id: item.id,
          date: item.date,
          location: item.location,
          team_id: item.team_id,
          grossSales: Number(item.gross_sales),
          netSales: Number(item.net_sales),
          orderCount: item.order_count,
          orderAverage: Number(item.order_average),
          labor: {
            cost: Number(item.labor_cost),
            hours: Number(item.labor_hours),
            percentage: Number(item.labor_percentage),
            salesPerLaborHour: Number(item.sales_per_labor_hour)
          },
          paymentBreakdown: {
            nonCash: Number(item.non_cash),
            totalCash: Number(item.total_cash),
            calculatedCash: Number(item.calculated_cash),
            tips: Number(item.tips)
          },
          voids: Number(item.voids || 0),
          refunds: Number(item.refunds || 0),
          surcharges: Number(item.surcharges || 0),
          expenses: Number(item.expenses || 0),
          discounts: rawData.discounts || [],
          taxes: rawData.taxes || [],
          destinations: rawData.destinations || [],
          revenueItems: rawData.revenueItems || [],
          tenders: rawData.tenders || [],
          promotions: rawData.promotions || [],
          cashManagement: rawData.cashManagement || { deposits: 0, payouts: 0 },
          giftCards: rawData.giftCardData || { issued: 0, reloaded: 0 }
        };
      });

      // Cache the results
      this.cache.set(cacheKey, {
        data: salesData,
        timestamp: Date.now()
      });

      console.log('[SalesDataService] Fetched and cached sales data:', salesData.length, 'records');
      return salesData;
    } catch (error) {
      console.error('[SalesDataService] Error fetching sales data:', error);
      throw error;
    }
  }

  async checkForExistingSalesData(date: string, teamIdOrLocation: string): Promise<{ exists: boolean; data?: any }> {
    try {
      const user = await this.getCurrentUser();

      // Prefer team_id when provided
      let query = supabase
        .from('sales_data')
        .select('*')
        .eq('organization_id', user.organization_id)
        .eq('date', date)
        .eq('team_id', teamIdOrLocation)
        .limit(1);

      let { data: existing, error } = await query;

      // Fallback to location match (for legacy rows)
      if (!existing || existing.length === 0) {
        const res = await supabase
          .from('sales_data')
          .select('*')
          .eq('organization_id', user.organization_id)
          .eq('date', date)
          .eq('location', teamIdOrLocation)
          .limit(1);
        existing = res.data || [];
      }

      return {
        exists: existing && existing.length > 0,
        data: existing?.[0] || null
      };
    } catch (error) {
      console.error('[SalesDataService] Error checking existing data:', error);
      return { exists: false };
    }
  }

  async addSalesData(salesData: SalesData, replaceExisting: boolean = false): Promise<void> {
    try {
      const user = await this.getCurrentUser();

      // Check for existing record using team_id/location
      const existingCheck = await this.checkForExistingSalesData(salesData.date, (salesData as any).team_id || salesData.location);

      if (existingCheck.exists && !replaceExisting) {
        const whereLabel = (salesData as any).team_id ? 'team' : 'location';
        throw new Error(`DUPLICATE_EXISTS:Sales data for ${salesData.date} (${whereLabel}) already exists`);
      }

      // If replacing, delete the existing record first
      if (existingCheck.exists && replaceExisting && existingCheck.data) {
        await this.deleteSalesData(existingCheck.data.id);
      }

      // If team_id provided, ensure location is human-readable team name for display
      let resolvedLocation = salesData.location;
      if ((salesData as any).team_id) {
        const { data: team } = await supabase
          .from('teams')
          .select('name')
          .eq('id', (salesData as any).team_id)
          .single();
        if (team?.name) {
          resolvedLocation = team.name;
        }
      }

      const insertData = {
        user_id: user.id,
        organization_id: user.organization_id,
        date: salesData.date,
        location: resolvedLocation,
        team_id: (salesData as any).team_id || null,
        gross_sales: salesData.grossSales,
        net_sales: salesData.netSales,
        order_count: salesData.orderCount,
        order_average: salesData.orderAverage,
        labor_cost: salesData.labor.cost,
        labor_hours: salesData.labor.hours,
        labor_percentage: salesData.labor.percentage,
        sales_per_labor_hour: salesData.labor.salesPerLaborHour,
        non_cash: salesData.paymentBreakdown.nonCash,
        total_cash: salesData.paymentBreakdown.totalCash,
        calculated_cash: salesData.paymentBreakdown.calculatedCash,
        tips: salesData.paymentBreakdown.tips,
        voids: salesData.voids || 0,
        refunds: salesData.refunds || 0,
        surcharges: salesData.surcharges || 0,
        expenses: salesData.expenses || 0,
        raw_data: {
          discounts: salesData.discounts,
          taxes: salesData.taxes,
          destinations: salesData.destinations,
          revenueItems: salesData.revenueItems,
          tenders: salesData.tenders,
          promotions: salesData.promotions,
          cashManagement: salesData.cashManagement,
          giftCardData: salesData.giftCards
        } as any
      };

      const { data: inserted, error } = await supabase
        .from('sales_data')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('[SalesDataService] Insert error:', error);
        throw new Error(`Failed to add sales data: ${error.message}`);
      }

      // Clear cache to force refresh
      this.clearCache();

      // After successful insert, sync sales channel transactions
      try {
        const { SalesChannelService } = await import('./SalesChannelService');
        await SalesChannelService.syncChannelTransactionsForSalesData(inserted.id, insertData, user.organization_id);
      } catch (e) {
        console.warn('[SalesDataService] Channel sync failed (non-fatal):', e);
      }

      console.log('[SalesDataService] Successfully added sales data');
      toast.success('Sales data uploaded successfully');
    } catch (error) {
      console.error('[SalesDataService] Error adding sales data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add sales data');
      throw error;
    }
  }

  async deleteSalesData(id: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await supabase
        .from('sales_data')
        .delete()
        .eq('id', id)
        .eq('organization_id', user.organization_id);

      if (error) {
        console.error('[SalesDataService] Delete error:', error);
        throw new Error(`Failed to delete sales data: ${error.message}`);
      }

      // Clear cache to force refresh
      this.clearCache();
      
      console.log('[SalesDataService] Successfully deleted sales data');
      toast.success('Sales data deleted successfully');
    } catch (error) {
      console.error('[SalesDataService] Error deleting sales data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete sales data');
      throw error;
    }
  }

  async deleteSalesDataByDate(date: string, teamIdOrLocation: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();

      // Attempt delete by team_id first
      let { error } = await supabase
        .from('sales_data')
        .delete()
        .eq('date', date)
        .eq('organization_id', user.organization_id)
        .eq('team_id', teamIdOrLocation);

      // If nothing deleted, fallback to location-based (legacy)
      if (error && !String(error.message).includes('No rows')) {
        // Ignore and try fallback delete anyway
      }

      // Perform fallback delete by location as well to ensure consistency
      await supabase
        .from('sales_data')
        .delete()
        .eq('date', date)
        .eq('organization_id', user.organization_id)
        .eq('location', teamIdOrLocation);

      // Clear cache to force refresh
      this.clearCache();

      console.log('[SalesDataService] Successfully deleted sales data for', date, teamIdOrLocation);
      toast.success(`Sales data for ${date} deleted successfully`);
    } catch (error) {
      console.error('[SalesDataService] Error deleting sales data by date:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete sales data');
      throw error;
    }
  }

  async getSalesStats(filters: SalesDataFilters = {}): Promise<SalesDataStats> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('sales_data')
        .select('date, location')
        .eq('organization_id', user.organization_id);

      if (error) {
        throw new Error(`Failed to get sales stats: ${error.message}`);
      }

      const stats: SalesDataStats = {
        total_records: data?.length || 0,
        unique_locations: [...new Set((data || []).map(item => item.location))],
        date_range: {
          earliest: '',
          latest: ''
        }
      };

      if (data && data.length > 0) {
        const dates = data.map(item => item.date).sort();
        stats.date_range.earliest = dates[0];
        stats.date_range.latest = dates[dates.length - 1];
      }

      return stats;
    } catch (error) {
      console.error('[SalesDataService] Error getting stats:', error);
      throw error;
    }
  }

  // Real-time subscription for sales data changes
  subscribeToSalesData(
    callback: (payload: any) => void,
    filters: SalesDataFilters = {}
  ) {
    const channel = supabase
      .channel('sales-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_data'
        },
        (payload) => {
          console.log('[SalesDataService] Real-time update:', payload);
          // Clear cache on any change
          this.clearCache();
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const salesDataService = SalesDataService.getInstance();