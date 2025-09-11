import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalculatedDateRange } from '@/utils/dateRangeUtils';
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval } from 'date-fns';

interface WeeklySalesSummaryParams {
  dateRange: CalculatedDateRange;
  teamId?: string | null;
}

interface DailyBreakdown {
  date: Date;
  sales: number;
  transactions: number;
}

interface TeamBreakdown {
  teamId: string;
  teamName: string;
  sales: number;
  transactions: number;
}

interface WeeklySalesSummaryData {
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  daysWithSales: number;
  maxDailySales: number;
  salesGrowth: number;
  transactionGrowth: number;
  avgTransactionGrowth: number;
  dailyBreakdown: DailyBreakdown[];
  teamBreakdown?: TeamBreakdown[];
}

export const useWeeklySalesSummaryData = ({ dateRange, teamId }: WeeklySalesSummaryParams) => {
  const weekStart = startOfWeek(dateRange.from, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(dateRange.from, { weekStartsOn: 1 });
  const prevWeekStart = startOfWeek(subWeeks(dateRange.from, 1), { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(subWeeks(dateRange.from, 1), { weekStartsOn: 1 });

  const { data: summaryData, isLoading, error } = useQuery({
    queryKey: ['weekly-sales-summary', format(weekStart, 'yyyy-MM-dd'), teamId],
    queryFn: async (): Promise<WeeklySalesSummaryData> => {
      // Get current week data
      let currentWeekQuery = supabase
        .from('sales_data')
        .select(`
          *,
          teams:team_id (
            name
          )
        `)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'));

      // Get previous week data for comparison
      let prevWeekQuery = supabase
        .from('sales_data')
        .select('*')
        .gte('date', format(prevWeekStart, 'yyyy-MM-dd'))
        .lte('date', format(prevWeekEnd, 'yyyy-MM-dd'));

      // Apply team filter if specified
      if (teamId && teamId !== 'all') {
        currentWeekQuery = currentWeekQuery.eq('team_id', teamId);
        prevWeekQuery = prevWeekQuery.eq('team_id', teamId);
      }

      const [currentWeekResult, prevWeekResult] = await Promise.all([
        currentWeekQuery,
        prevWeekQuery
      ]);

      if (currentWeekResult.error) {
        throw currentWeekResult.error;
      }

      const currentWeekData = currentWeekResult.data || [];
      const prevWeekData = prevWeekResult.data || [];

      // Calculate current week metrics
      const totalSales = currentWeekData.reduce((sum, record) => sum + (record.net_sales || 0), 0);
      const totalTransactions = currentWeekData.reduce((sum, record) => sum + (record.order_count || 0), 0);
      const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      // Calculate previous week metrics for comparison
      const prevTotalSales = prevWeekData.reduce((sum, record) => sum + (record.net_sales || 0), 0);
      const prevTotalTransactions = prevWeekData.reduce((sum, record) => sum + (record.order_count || 0), 0);
      const prevAverageTransaction = prevTotalTransactions > 0 ? prevTotalSales / prevTotalTransactions : 0;

      // Calculate growth percentages
      const salesGrowth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
      const transactionGrowth = prevTotalTransactions > 0 ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100 : 0;
      const avgTransactionGrowth = prevAverageTransaction > 0 ? ((averageTransaction - prevAverageTransaction) / prevAverageTransaction) * 100 : 0;

      // Create daily breakdown
      const allDaysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const dailyBreakdown: DailyBreakdown[] = allDaysInWeek.map(date => {
        const dayData = currentWeekData.filter(record => 
          format(new Date(record.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        
        return {
          date,
          sales: dayData.reduce((sum, record) => sum + (record.net_sales || 0), 0),
          transactions: dayData.reduce((sum, record) => sum + (record.order_count || 0), 0)
        };
      });

      const daysWithSales = dailyBreakdown.filter(day => day.sales > 0).length;
      const maxDailySales = Math.max(...dailyBreakdown.map(day => day.sales), 0);

      // Create team breakdown if no specific team is selected
      let teamBreakdown: TeamBreakdown[] | undefined;
      if (!teamId || teamId === 'all') {
        const teamMap = new Map<string, { sales: number; transactions: number; teamName: string }>();
        
        currentWeekData.forEach(record => {
          const teamId = record.team_id || 'unassigned';
          const teamName = (record as any).teams?.name || 'Unassigned';
          
          if (!teamMap.has(teamId)) {
            teamMap.set(teamId, { sales: 0, transactions: 0, teamName });
          }
          
          const team = teamMap.get(teamId)!;
          team.sales += record.net_sales || 0;
          team.transactions += record.order_count || 0;
        });

        teamBreakdown = Array.from(teamMap.entries()).map(([teamId, data]) => ({
          teamId,
          teamName: data.teamName,
          sales: data.sales,
          transactions: data.transactions
        })).sort((a, b) => b.sales - a.sales);
      }

      return {
        totalSales,
        totalTransactions,
        averageTransaction,
        daysWithSales,
        maxDailySales,
        salesGrowth,
        transactionGrowth,
        avgTransactionGrowth,
        dailyBreakdown,
        teamBreakdown
      };
    },
    enabled: !!weekStart
  });

  return {
    summaryData,
    isLoading,
    error
  };
};