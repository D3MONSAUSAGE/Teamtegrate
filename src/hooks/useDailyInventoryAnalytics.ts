import { useMemo } from 'react';
import { InventoryCount, InventoryAlert, InventoryItem, InventoryTransaction } from '@/contexts/inventory/types';
import { format, isSameDay, startOfDay, endOfDay } from 'date-fns';

export interface DailyAnalyticsMetrics {
  totalValue: number;
  totalItemsCounted: number;
  totalVarianceCost: number;
  accuracyRate: number;
  averageCompletionTime: number;
  completedCounts: number;
  activeTeams: number;
  trendDirection: 'up' | 'down' | 'stable';
}

export interface DailyChartData {
  itemBreakdown: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  varianceBreakdown: Array<{
    item: string;
    expected: number;
    actual: number;
    variance: number;
    cost: number;
  }>;
  teamPerformance: Array<{
    team: string;
    counts: number;
    accuracy: number;
    totalItems: number;
  }>;
}

export const useDailyInventoryAnalytics = (
  counts: InventoryCount[],
  alerts: InventoryAlert[],
  items: InventoryItem[],
  transactions: InventoryTransaction[],
  selectedDate: Date
) => {
  const analytics = useMemo(() => {
    // Filter counts for the selected date (excluding voided counts)
    const dailyCounts = counts.filter(count => 
      isSameDay(new Date(count.count_date), selectedDate) && !count.is_voided
    );

    // Filter transactions for the selected date
    const dailyTransactions = transactions.filter(transaction =>
      isSameDay(new Date(transaction.transaction_date), selectedDate)
    );

    // Calculate daily metrics
    const completedCounts = dailyCounts.filter(c => c.status === 'completed');
    const totalItemsCounted = completedCounts.reduce((sum, count) => sum + count.total_items_count, 0);
    const totalVariances = completedCounts.reduce((sum, count) => sum + count.variance_count, 0);
    
    // Mock calculations for value and variance cost (would use real unit costs in production)
    const totalValue = totalItemsCounted * 25; // $25 average per item
    const totalVarianceCost = totalVariances * 15; // $15 average cost per variance
    
    const accuracyRate = totalItemsCounted > 0 ? 
      ((totalItemsCounted - totalVariances) / totalItemsCounted) * 100 : 100;

    // Calculate average completion time for completed counts
    const averageCompletionTime = completedCounts.length > 0 ?
      completedCounts.reduce((sum, count) => {
        const created = new Date(count.created_at);
        const updated = new Date(count.updated_at);
        return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
      }, 0) / completedCounts.length : 0;

    // Count unique teams that performed counts on this date
    const activeTeams = new Set(dailyCounts.map(count => count.team_id)).size;

    // Simple trend calculation (compare with day before - would need historical data)
    const trendDirection: 'up' | 'down' | 'stable' = 'stable';

    const metrics: DailyAnalyticsMetrics = {
      totalValue,
      totalItemsCounted,
      totalVarianceCost,
      accuracyRate,
      averageCompletionTime,
      completedCounts: completedCounts.length,
      activeTeams,
      trendDirection
    };

    // Generate chart data
    const categoryMap = new Map<string, { count: number; value: number }>();
    
    // Mock item breakdown by category for the day
    items.forEach(item => {
      const category = item.category?.name || 'Uncategorized';
      const itemCountsToday = dailyTransactions.filter(t => t.item_id === item.id && t.transaction_type === 'count');
      const count = itemCountsToday.length;
      const value = count * (item.unit_cost || 25);
      
      if (count > 0) {
        const existing = categoryMap.get(category) || { count: 0, value: 0 };
        categoryMap.set(category, {
          count: existing.count + count,
          value: existing.value + value
        });
      }
    });

    const itemBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      value: data.value
    }));

    // Mock variance breakdown (would calculate from actual count items)
    const varianceBreakdown = completedCounts
      .filter(count => count.variance_count > 0)
      .slice(0, 10) // Top 10 variances
      .map((count, index) => ({
        item: `Item ${index + 1}`,
        expected: Math.floor(Math.random() * 100) + 50,
        actual: Math.floor(Math.random() * 100) + 30,
        variance: count.variance_count / Math.max(1, completedCounts.length),
        cost: (count.variance_count / Math.max(1, completedCounts.length)) * 15
      }));

    // Team performance for the day
    const teamMap = new Map<string, { counts: number; totalItems: number; totalVariances: number }>();
    
    dailyCounts.forEach(count => {
      const teamId = count.team_id || 'unassigned';
      const existing = teamMap.get(teamId) || { counts: 0, totalItems: 0, totalVariances: 0 };
      teamMap.set(teamId, {
        counts: existing.counts + 1,
        totalItems: existing.totalItems + count.total_items_count,
        totalVariances: existing.totalVariances + count.variance_count
      });
    });

    const teamPerformance = Array.from(teamMap.entries()).map(([team, data]) => ({
      team: team === 'unassigned' ? 'Unassigned' : `Team ${team.slice(0, 8)}`,
      counts: data.counts,
      accuracy: data.totalItems > 0 ? 
        ((data.totalItems - data.totalVariances) / data.totalItems) * 100 : 100,
      totalItems: data.totalItems
    }));

    const chartData: DailyChartData = {
      itemBreakdown,
      varianceBreakdown,
      teamPerformance
    };

    return { metrics, chartData };
  }, [counts, alerts, items, transactions, selectedDate]);

  return analytics;
};