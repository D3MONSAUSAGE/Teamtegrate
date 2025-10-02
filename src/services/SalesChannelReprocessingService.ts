import { supabase } from '@/integrations/supabase/client';
import { SalesChannelServiceSingleton } from './SalesChannelService';
import { toast } from '@/components/ui/sonner';

interface ReprocessingResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  totalFeesGenerated: number;
  errors: string[];
}

/**
 * Service to retroactively process sales data with current channel settings
 */
class SalesChannelReprocessingService {
  /**
   * Reprocess all sales data or filtered by date range
   */
  async reprocessAllSalesData(
    startDate?: string,
    endDate?: string,
    teamId?: string
  ): Promise<ReprocessingResult> {
    const result: ReprocessingResult = {
      success: false,
      processedCount: 0,
      errorCount: 0,
      totalFeesGenerated: 0,
      errors: [],
    };

    try {
      // Build query for sales data
      let query = supabase
        .from('sales_data')
        .select('*')
        .order('date', { ascending: true });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data: salesData, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching sales data:', fetchError);
        result.errors.push(`Failed to fetch sales data: ${fetchError.message}`);
        return result;
      }

      if (!salesData || salesData.length === 0) {
        console.log('No sales data found to reprocess');
        result.success = true;
        return result;
      }

      console.log(`Reprocessing ${salesData.length} sales records...`);

      // Process each sales record
      for (const sale of salesData) {
        try {
          // Delete existing channel transactions for this sale
          const { error: deleteError } = await supabase
            .from('sales_channel_transactions')
            .delete()
            .eq('sales_data_id', sale.id);

          if (deleteError) {
            console.error(`Error deleting existing transactions for sale ${sale.id}:`, deleteError);
            result.errors.push(`Sale ${sale.date}: Failed to delete old transactions`);
            result.errorCount++;
            continue;
          }

          // Sync new channel transactions with current settings
          await SalesChannelServiceSingleton.syncChannelTransactionsForSalesData(
            sale.id,
            sale,
            sale.organization_id
          );
          
          // Fetch the newly created transactions to calculate fees
          const { data: newTransactions } = await supabase
            .from('sales_channel_transactions')
            .select('commission_fee')
            .eq('sales_data_id', sale.id);

          if (newTransactions) {
            const feesForThisSale = newTransactions.reduce(
              (sum, t) => sum + (t.commission_fee || 0),
              0
            );
            result.totalFeesGenerated += feesForThisSale;
          }

          result.processedCount++;
        } catch (error) {
          console.error(`Error processing sale ${sale.id}:`, error);
          result.errors.push(`Sale ${sale.date}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.errorCount++;
        }
      }

      result.success = result.errorCount < salesData.length;
      console.log('Reprocessing complete:', result);

      return result;
    } catch (error) {
      console.error('Error in reprocessAllSalesData:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Get a summary of what would be reprocessed (dry run)
   */
  async getReprocessingSummary(
    startDate?: string,
    endDate?: string,
    teamId?: string
  ): Promise<{
    salesCount: number;
    teamsAffected: string[];
    dateRange: { start: string; end: string };
    existingTransactionCount: number;
  }> {
    let query = supabase
      .from('sales_data')
      .select('id, date, team_id')
      .order('date', { ascending: true });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (teamId) query = query.eq('team_id', teamId);

    const { data: salesData } = await query;

    if (!salesData || salesData.length === 0) {
      return {
        salesCount: 0,
        teamsAffected: [],
        dateRange: { start: '', end: '' },
        existingTransactionCount: 0,
      };
    }

    const uniqueTeams = [...new Set(salesData.map(s => s.team_id).filter(Boolean))];
    
    // Count existing transactions
    const salesIds = salesData.map(s => s.id);
    const { count } = await supabase
      .from('sales_channel_transactions')
      .select('*', { count: 'exact', head: true })
      .in('sales_data_id', salesIds);

    return {
      salesCount: salesData.length,
      teamsAffected: uniqueTeams as string[],
      dateRange: {
        start: salesData[0].date,
        end: salesData[salesData.length - 1].date,
      },
      existingTransactionCount: count || 0,
    };
  }
}

export const SalesChannelReprocessingServiceSingleton = new SalesChannelReprocessingService();
