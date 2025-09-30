import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TransactionDetail {
  id: string;
  time: string;
  reference_number: string | null;
  item_name: string;
  quantity: number;
  unit_cost: number;
  sale_price: number;
  revenue: number;
  profit: number;
  processed_by: string | null;
}

export interface DailyFinancialMetrics {
  // Revenue metrics
  totalRevenue: number;
  totalTransactions: number;
  averageTicket: number;
  
  // Cost metrics
  totalCOGS: number;
  
  // Profit metrics
  grossProfit: number;
  profitMargin: number;
  
  // Inventory flow
  totalIncoming: number;
  totalOutgoing: number;
  netChange: number;
  
  // Top performers
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }>;
  
  // Hourly breakdown
  hourlyRevenue: Array<{
    hour: string;
    revenue: number;
    transactions: number;
  }>;
  
  // Comparison
  vsYesterday: {
    revenue: number;
    profit: number;
    transactions: number;
  };
  
  // Raw transaction data for reporting
  transactions: TransactionDetail[];
}

interface Transaction {
  id: string;
  transaction_type: string;
  quantity: number;
  unit_cost: number;
  sale_price: number | null;
  revenue: number | null;
  cost_of_goods: number | null;
  profit: number | null;
  transaction_date: string;
  reference_number: string | null;
  notes: string | null;
  processed_by: string | null;
  inventory_items: {
    name: string;
  } | null;
}

export const useDailyFinancialAnalytics = (
  selectedDate: Date | null,
  teamIds: string[] = [],
  timezone: string = 'UTC'
) => {
  const [metrics, setMetrics] = useState<DailyFinancialMetrics>({
    totalRevenue: 0,
    totalTransactions: 0,
    averageTicket: 0,
    totalCOGS: 0,
    grossProfit: 0,
    profitMargin: 0,
    totalIncoming: 0,
    totalOutgoing: 0,
    netChange: 0,
    topSellingItems: [],
    hourlyRevenue: [],
    vsYesterday: { revenue: 0, profit: 0, transactions: 0 },
    transactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!selectedDate) return;

      setLoading(true);
      try {
        // Get date range for selected day (in UTC)
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Get previous day range for comparison
        const prevDayStart = new Date(startOfDay);
        prevDayStart.setDate(prevDayStart.getDate() - 1);
        const prevDayEnd = new Date(endOfDay);
        prevDayEnd.setDate(prevDayEnd.getDate() - 1);

        // Fetch today's transactions with full details
        let todayQuery = supabase
          .from('inventory_transactions')
          .select(`
            id,
            transaction_type,
            quantity,
            unit_cost,
            sale_price,
            revenue,
            cost_of_goods,
            profit,
            transaction_date,
            reference_number,
            notes,
            processed_by,
            inventory_items(name)
          `)
          .gte('transaction_date', startOfDay.toISOString())
          .lte('transaction_date', endOfDay.toISOString());

        if (teamIds.length > 0) {
          todayQuery = todayQuery.in('team_id', teamIds);
        }

        const { data: todayTransactions, error: todayError } = await todayQuery;

        if (todayError) throw todayError;

        // Fetch yesterday's transactions for comparison
        let yesterdayQuery = supabase
          .from('inventory_transactions')
          .select('transaction_type, revenue, profit')
          .gte('transaction_date', prevDayStart.toISOString())
          .lte('transaction_date', prevDayEnd.toISOString())
          .eq('transaction_type', 'out');

        if (teamIds.length > 0) {
          yesterdayQuery = yesterdayQuery.in('team_id', teamIds);
        }

        const { data: yesterdayTransactions } = await yesterdayQuery;

        // Calculate today's metrics
        const transactions = (todayTransactions || []) as Transaction[];
        const outTransactions = transactions.filter(t => t.transaction_type === 'out');
        const inTransactions = transactions.filter(t => t.transaction_type === 'in');

        const totalRevenue = outTransactions.reduce((sum, t) => sum + (t.revenue || 0), 0);
        const totalCOGS = outTransactions.reduce((sum, t) => sum + (t.cost_of_goods || 0), 0);
        const grossProfit = outTransactions.reduce((sum, t) => sum + (t.profit || 0), 0);
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        const totalIncoming = inTransactions.reduce((sum, t) => 
          sum + (Math.abs(t.quantity) * (t.unit_cost || 0)), 0
        );
        const totalOutgoing = outTransactions.reduce((sum, t) => 
          sum + (t.cost_of_goods || 0), 0
        );

        // Calculate yesterday's metrics for comparison
        const yesterdayRevenue = (yesterdayTransactions || []).reduce((sum, t: any) => sum + (t.revenue || 0), 0);
        const yesterdayProfit = (yesterdayTransactions || []).reduce((sum, t: any) => sum + (t.profit || 0), 0);
        const yesterdayCount = yesterdayTransactions?.length || 0;

        const vsYesterday = {
          revenue: yesterdayRevenue > 0 ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0,
          profit: yesterdayProfit > 0 ? ((grossProfit - yesterdayProfit) / yesterdayProfit) * 100 : 0,
          transactions: yesterdayCount > 0 ? ((outTransactions.length - yesterdayCount) / yesterdayCount) * 100 : 0
        };

        // Calculate top selling items
        const itemStats = new Map<string, { quantity: number; revenue: number; profit: number }>();
        outTransactions.forEach(t => {
          const itemName = t.inventory_items?.name || 'Unknown Item';
          const existing = itemStats.get(itemName) || { quantity: 0, revenue: 0, profit: 0 };
          itemStats.set(itemName, {
            quantity: existing.quantity + Math.abs(t.quantity),
            revenue: existing.revenue + (t.revenue || 0),
            profit: existing.profit + (t.profit || 0)
          });
        });

        const topSellingItems = Array.from(itemStats.entries())
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        // Calculate hourly revenue
        const hourlyStats = new Map<number, { revenue: number; count: number }>();
        outTransactions.forEach(t => {
          const hour = new Date(t.transaction_date).getHours();
          const existing = hourlyStats.get(hour) || { revenue: 0, count: 0 };
          hourlyStats.set(hour, {
            revenue: existing.revenue + (t.revenue || 0),
            count: existing.count + 1
          });
        });

        const hourlyRevenue = Array.from(hourlyStats.entries())
          .map(([hour, stats]) => ({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            revenue: stats.revenue,
            transactions: stats.count
          }))
          .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

        // Fetch user information for transactions with processed_by
        const userIds = [...new Set(outTransactions.map(t => t.processed_by).filter(Boolean))];
        let usersMap = new Map<string, { name: string; email: string }>();
        
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', userIds);
          
          if (usersData) {
            usersData.forEach(u => usersMap.set(u.id, { name: u.name || '', email: u.email || '' }));
          }
        }

        // Format transaction details for reporting
        const transactionDetails: TransactionDetail[] = outTransactions
          .map(t => {
            const user = t.processed_by ? usersMap.get(t.processed_by) : null;
            return {
              id: t.id,
              time: new Date(t.transaction_date).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }),
              reference_number: t.reference_number || 'N/A',
              item_name: t.inventory_items?.name || 'Unknown Item',
              quantity: Math.abs(t.quantity),
              unit_cost: t.unit_cost || 0,
              sale_price: t.sale_price || 0,
              revenue: t.revenue || 0,
              profit: t.profit || 0,
              processed_by: user?.name || user?.email || 'System'
            };
          })
          .sort((a, b) => {
            const [aHour, aMin] = a.time.split(':');
            const [bHour, bMin] = b.time.split(':');
            return (parseInt(aHour) * 60 + parseInt(aMin)) - (parseInt(bHour) * 60 + parseInt(bMin));
          });

        setMetrics({
          totalRevenue,
          totalTransactions: outTransactions.length,
          averageTicket: outTransactions.length > 0 ? totalRevenue / outTransactions.length : 0,
          totalCOGS,
          grossProfit,
          profitMargin,
          totalIncoming,
          totalOutgoing,
          netChange: totalIncoming - totalOutgoing,
          topSellingItems,
          hourlyRevenue,
          vsYesterday,
          transactions: transactionDetails
        });
      } catch (error) {
        console.error('Error fetching financial analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [selectedDate, teamIds, timezone]);

  return { metrics, loading };
};
