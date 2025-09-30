import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SalesChannelTransaction } from '@/types/salesChannels';

interface UseSalesChannelTransactionsReturn {
  transactions: SalesChannelTransaction[];
  isLoading: boolean;
  error: string | null;
  totalCommission: number;
  channelBreakdown: Record<string, { grossSales: number; commission: number; netSales: number; orders: number }>;
}

export const useSalesChannelTransactions = (
  startDate: string,
  endDate: string,
  teamId?: string
): UseSalesChannelTransactionsReturn => {
  const [transactions, setTransactions] = useState<SalesChannelTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('sales_channel_transactions')
          .select(`
            *,
            channel:sales_channels(*)
          `)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });

        if (teamId && teamId !== 'all') {
          query = query.eq('team_id', teamId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setTransactions((data || []) as SalesChannelTransaction[]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch channel transactions';
        setError(errorMessage);
        console.error('[useSalesChannelTransactions] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchTransactions();
    }
  }, [startDate, endDate, teamId]);

  // Calculate totals and breakdown
  const totalCommission = transactions.reduce((sum, t) => sum + t.commission_fee, 0);

  const channelBreakdown = transactions.reduce((acc, t) => {
    const channelName = t.channel?.name || 'Unknown';
    if (!acc[channelName]) {
      acc[channelName] = {
        grossSales: 0,
        commission: 0,
        netSales: 0,
        orders: 0
      };
    }
    acc[channelName].grossSales += t.gross_sales;
    acc[channelName].commission += t.commission_fee;
    acc[channelName].netSales += t.net_sales;
    acc[channelName].orders += t.order_count;
    return acc;
  }, {} as Record<string, { grossSales: number; commission: number; netSales: number; orders: number }>);

  return {
    transactions,
    isLoading,
    error,
    totalCommission,
    channelBreakdown
  };
};
