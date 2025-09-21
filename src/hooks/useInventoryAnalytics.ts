import { useMemo } from 'react';
import { InventoryCount, InventoryAlert, InventoryItem, InventoryTransaction } from '@/contexts/inventory/types';
import { subDays, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export interface AnalyticsMetrics {
  accuracyRate: number;
  averageCompletionTime: number;
  totalVariances: number;
  trendDirection: 'up' | 'down' | 'stable';
  monthlyComparison: number;
}

export interface ChartData {
  completionTrend: Array<{
    date: string;
    completed: number;
    inProgress: number;
    accuracy: number;
  }>;
  varianceAnalysis: Array<{
    date: string;
    variance: number;
    items: number;
  }>;
  teamPerformance: Array<{
    team: string;
    accuracy: number;
    counts: number;
    avgTime: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    accuracy: number;
  }>;
  alertTrends: Array<{
    date: string;
    lowStock: number;
    overStock: number;
    expired: number;
  }>;
}

export const useInventoryAnalytics = (
  counts: InventoryCount[],
  alerts: InventoryAlert[],
  items: InventoryItem[],
  transactions: InventoryTransaction[]
) => {
  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const recentCounts = counts.filter(count => 
      new Date(count.count_date) >= thirtyDaysAgo
    );

    // Calculate accuracy rate
    const completedCounts = recentCounts.filter(c => c.status === 'completed');
    const totalVariances = completedCounts.reduce((sum, count) => sum + count.variance_count, 0);
    const totalItems = completedCounts.reduce((sum, count) => sum + count.total_items_count, 0);
    const accuracyRate = totalItems > 0 ? ((totalItems - totalVariances) / totalItems) * 100 : 0;

    // Calculate average completion time (mock data for now)
    const averageCompletionTime = completedCounts.length > 0 ? 
      completedCounts.reduce((sum, count) => {
        const createdAt = new Date(count.created_at);
        const countDate = new Date(count.count_date);
        return sum + Math.abs(countDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      }, 0) / completedCounts.length : 0;

    // Trend analysis
    const thisMonth = recentCounts.filter(count => 
      isWithinInterval(new Date(count.count_date), {
        start: startOfMonth(now),
        end: endOfMonth(now)
      })
    );
    const lastMonth = counts.filter(count => 
      isWithinInterval(new Date(count.count_date), {
        start: startOfMonth(subDays(now, 30)),
        end: endOfMonth(subDays(now, 30))
      })
    );

    const monthlyComparison = lastMonth.length > 0 ? 
      ((thisMonth.length - lastMonth.length) / lastMonth.length) * 100 : 0;

    const trendDirection: 'up' | 'down' | 'stable' = 
      monthlyComparison > 5 ? 'up' : 
      monthlyComparison < -5 ? 'down' : 'stable';

    const metrics: AnalyticsMetrics = {
      accuracyRate,
      averageCompletionTime,
      totalVariances,
      trendDirection,
      monthlyComparison
    };

    // Generate chart data
    const completionTrend = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(now, 29 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayCounts = counts.filter(count => 
        format(new Date(count.count_date), 'yyyy-MM-dd') === dateStr
      );
      
      const completed = dayCounts.filter(c => c.status === 'completed').length;
      const inProgress = dayCounts.filter(c => c.status === 'in_progress').length;
      const dayVariances = dayCounts.reduce((sum, c) => sum + c.variance_count, 0);
      const dayItems = dayCounts.reduce((sum, c) => sum + c.total_items_count, 0);
      const accuracy = dayItems > 0 ? ((dayItems - dayVariances) / dayItems) * 100 : 100;

      return {
        date: format(date, 'MMM dd'),
        completed,
        inProgress,
        accuracy
      };
    });

    const varianceAnalysis = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(now, 13 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayCounts = counts.filter(count => 
        format(new Date(count.count_date), 'yyyy-MM-dd') === dateStr &&
        count.status === 'completed'
      );
      
      return {
        date: format(date, 'MMM dd'),
        variance: dayCounts.reduce((sum, c) => sum + c.variance_count, 0),
        items: dayCounts.reduce((sum, c) => sum + c.total_items_count, 0)
      };
    });

    // Mock team performance data (would need team info in real implementation)
    const teamPerformance = [
      { team: 'Warehouse A', accuracy: 95.2, counts: 15, avgTime: 2.3 },
      { team: 'Warehouse B', accuracy: 89.7, counts: 12, avgTime: 3.1 },
      { team: 'Store Front', accuracy: 92.1, counts: 8, avgTime: 1.8 },
      { team: 'Storage', accuracy: 87.4, counts: 6, avgTime: 4.2 }
    ];

    // Category breakdown from items
    const categoryMap = items.reduce((acc, item) => {
      const category = item.category?.name || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { count: 0, items: [] };
      }
      acc[category].count++;
      acc[category].items.push(item);
      return acc;
    }, {} as Record<string, { count: number; items: InventoryItem[] }>);

    const categoryBreakdown = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      count: data.count,
      accuracy: Math.random() * 10 + 88 // Mock accuracy, would calculate from actual count data
    }));

    // Alert trends
    const alertTrends = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(now, 13 - i);
      return {
        date: format(date, 'MMM dd'),
        lowStock: Math.floor(Math.random() * 5),
        overStock: Math.floor(Math.random() * 3),
        expired: Math.floor(Math.random() * 2)
      };
    });

    const chartData: ChartData = {
      completionTrend,
      varianceAnalysis,
      teamPerformance,
      categoryBreakdown,
      alertTrends
    };

    return { metrics, chartData };
  }, [counts, alerts, items, transactions]);

  return analytics;
};