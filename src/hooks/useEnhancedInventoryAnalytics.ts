import { useMemo } from 'react';
import { InventoryCount, InventoryAlert, InventoryItem, InventoryTransaction } from '@/contexts/inventory/types';
import { subDays, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export interface FinancialMetrics {
  totalInventoryValue: number;
  totalVarianceCost: number;
  costSavings: number;
  averageItemValue: number;
  mostExpensiveVariance: number;
  totalCostImpact: number;
}

export interface TeamPerformanceMetrics {
  teamId: string;
  teamName: string;
  accuracy: number;
  completionTime: number;
  countCompletions: number;
  varianceCost: number;
  inventoryValue: number;
  improvementTrend: 'up' | 'down' | 'stable';
}

export interface CountComparison {
  currentCount: InventoryCount;
  previousCount: InventoryCount | null;
  itemComparisons: Array<{
    itemId: string;
    itemName: string;
    currentQuantity: number;
    previousQuantity: number;
    quantityChange: number;
    currentValue: number;
    previousValue: number;
    valueChange: number;
    unitCost: number;
  }>;
  totalValueChange: number;
  accuracyImprovement: number;
}

export interface EnhancedChartData {
  financialTrends: Array<{
    date: string;
    inventoryValue: number;
    varianceCost: number;
    costSavings: number;
  }>;
  teamComparison: Array<{
    team: string;
    accuracy: number;
    varianceCost: number;
    inventoryValue: number;
    completionTime: number;
    counts: number;
  }>;
  costAnalysis: Array<{
    category: string;
    totalValue: number;
    varianceCost: number;
    accuracy: number;
  }>;
  monthlyPerformance: Array<{
    month: string;
    totalValue: number;
    accuracy: number;
    teamCount: number;
    varianceCost: number;
  }>;
}

export interface EnhancedAnalyticsMetrics {
  // Existing metrics
  accuracyRate: number;
  averageCompletionTime: number;
  totalVariances: number;
  trendDirection: 'up' | 'down' | 'stable';
  monthlyComparison: number;
  
  // Financial metrics
  financial: FinancialMetrics;
  
  // Team performance
  teamPerformance: TeamPerformanceMetrics[];
  
  // Count comparisons
  recentComparisons: CountComparison[];
}

export const useEnhancedInventoryAnalytics = (
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

    // Calculate basic metrics (existing functionality)
    const completedCounts = recentCounts.filter(c => c.status === 'completed');
    const totalVariances = completedCounts.reduce((sum, count) => sum + count.variance_count, 0);
    const totalItems = completedCounts.reduce((sum, count) => sum + count.total_items_count, 0);
    const accuracyRate = totalItems > 0 ? ((totalItems - totalVariances) / totalItems) * 100 : 0;

    // Calculate average completion time
    const averageCompletionTime = completedCounts.length > 0 ? 
      completedCounts.reduce((sum, count) => {
        const createdAt = new Date(count.created_at);
        const countDate = new Date(count.count_date);
        return sum + Math.abs(countDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      }, 0) / completedCounts.length : 0;

    // Calculate financial metrics
    const calculateFinancialMetrics = (): FinancialMetrics => {
      const itemMap = new Map(items.map(item => [item.id, item]));
      
      let totalInventoryValue = 0;
      let totalVarianceCost = 0;
      let costSavings = 0;
      let mostExpensiveVariance = 0;

      completedCounts.forEach(count => {
        // For now, use mock data for count items
        // In real implementation, you'd fetch count items for each count
        const mockCountItems = items.slice(0, 10).map(item => ({
          itemId: item.id,
          actualQuantity: Math.floor(Math.random() * 50) + 10,
          expectedQuantity: Math.floor(Math.random() * 50) + 10,
          unitCost: item.unit_cost || item.purchase_price || 10
        }));

        mockCountItems.forEach(countItem => {
          const inventoryValue = countItem.actualQuantity * countItem.unitCost;
          totalInventoryValue += inventoryValue;

          const variance = countItem.actualQuantity - countItem.expectedQuantity;
          const varianceCost = Math.abs(variance * countItem.unitCost);
          totalVarianceCost += varianceCost;

          if (varianceCost > mostExpensiveVariance) {
            mostExpensiveVariance = varianceCost;
          }

          // Cost savings when actual is less than expected (avoiding overstock)
          if (variance < 0) {
            costSavings += Math.abs(variance * countItem.unitCost);
          }
        });
      });

      const averageItemValue = totalItems > 0 ? totalInventoryValue / totalItems : 0;
      const totalCostImpact = totalVarianceCost - costSavings;

      return {
        totalInventoryValue,
        totalVarianceCost,
        costSavings,
        averageItemValue,
        mostExpensiveVariance,
        totalCostImpact
      };
    };

    // Calculate team performance metrics
    const calculateTeamPerformance = (): TeamPerformanceMetrics[] => {
      const teamStats = new Map<string, {
        totalAccuracy: number;
        totalTime: number;
        countCompletions: number;
        totalVarianceCost: number;
        totalInventoryValue: number;
      }>();

      completedCounts.forEach(count => {
        const teamId = count.team_id || 'unassigned';
        const teamName = 'Team ' + (count.team_id || 'Unassigned');
        
        if (!teamStats.has(teamId)) {
          teamStats.set(teamId, {
            totalAccuracy: 0,
            totalTime: 0,
            countCompletions: 0,
            totalVarianceCost: 0,
            totalInventoryValue: 0
          });
        }

        const stats = teamStats.get(teamId)!;
        const accuracy = count.total_items_count > 0 ? 
          ((count.total_items_count - count.variance_count) / count.total_items_count) * 100 : 0;
        
        stats.totalAccuracy += accuracy;
        stats.totalTime += Math.abs(new Date(count.updated_at || count.created_at).getTime() - new Date(count.created_at).getTime()) / (1000 * 60 * 60);
        stats.countCompletions += 1;
        
        // Mock financial data for teams
        stats.totalVarianceCost += count.variance_count * 15; // Assume $15 per variance
        stats.totalInventoryValue += count.total_items_count * 25; // Assume $25 per item
      });

      return Array.from(teamStats.entries()).map(([teamId, stats]) => ({
        teamId,
        teamName: 'Team ' + teamId,
        accuracy: stats.countCompletions > 0 ? stats.totalAccuracy / stats.countCompletions : 0,
        completionTime: stats.countCompletions > 0 ? stats.totalTime / stats.countCompletions : 0,
        countCompletions: stats.countCompletions,
        varianceCost: stats.totalVarianceCost,
        inventoryValue: stats.totalInventoryValue,
        improvementTrend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable' as 'up' | 'down' | 'stable'
      }));
    };

    // Calculate count comparisons
    const calculateCountComparisons = (): CountComparison[] => {
      const sortedCounts = [...completedCounts].sort((a, b) => 
        new Date(b.count_date).getTime() - new Date(a.count_date).getTime()
      );

      return sortedCounts.slice(0, 5).map((currentCount, index) => {
        const previousCount = sortedCounts[index + 1] || null;
        
        // Mock item comparisons
        const itemComparisons = items.slice(0, 8).map(item => {
          const currentQuantity = Math.floor(Math.random() * 50) + 10;
          const previousQuantity = previousCount ? Math.floor(Math.random() * 50) + 10 : 0;
          const unitCost = item.unit_cost || item.purchase_price || 10;
          
          return {
            itemId: item.id,
            itemName: item.name,
            currentQuantity,
            previousQuantity,
            quantityChange: currentQuantity - previousQuantity,
            currentValue: currentQuantity * unitCost,
            previousValue: previousQuantity * unitCost,
            valueChange: (currentQuantity - previousQuantity) * unitCost,
            unitCost
          };
        });

        const totalValueChange = itemComparisons.reduce((sum, item) => sum + item.valueChange, 0);
        
        const currentAccuracy = currentCount.total_items_count > 0 ? 
          ((currentCount.total_items_count - currentCount.variance_count) / currentCount.total_items_count) * 100 : 0;
        const previousAccuracy = previousCount && previousCount.total_items_count > 0 ? 
          ((previousCount.total_items_count - previousCount.variance_count) / previousCount.total_items_count) * 100 : 0;
        
        return {
          currentCount,
          previousCount,
          itemComparisons,
          totalValueChange,
          accuracyImprovement: currentAccuracy - previousAccuracy
        };
      });
    };

    // Generate enhanced chart data
    const generateChartData = (): EnhancedChartData => {
      return {
        financialTrends: Array.from({ length: 14 }, (_, i) => {
          const date = subDays(now, 13 - i);
          return {
            date: format(date, 'MMM dd'),
            inventoryValue: Math.floor(Math.random() * 50000) + 25000,
            varianceCost: Math.floor(Math.random() * 2000) + 500,
            costSavings: Math.floor(Math.random() * 1000) + 200
          };
        }),
        
        teamComparison: calculateTeamPerformance().slice(0, 6).map(team => ({
          team: team.teamName,
          accuracy: team.accuracy,
          varianceCost: team.varianceCost,
          inventoryValue: team.inventoryValue,
          completionTime: team.completionTime,
          counts: team.countCompletions
        })),
        
        costAnalysis: ['Electronics', 'Supplies', 'Tools', 'Materials', 'Safety'].map(category => ({
          category,
          totalValue: Math.floor(Math.random() * 20000) + 5000,
          varianceCost: Math.floor(Math.random() * 1000) + 100,
          accuracy: Math.random() * 15 + 85
        })),
        
        monthlyPerformance: Array.from({ length: 6 }, (_, i) => {
          const date = subDays(startOfMonth(now), i * 30);
          return {
            month: format(date, 'MMM yyyy'),
            totalValue: Math.floor(Math.random() * 100000) + 50000,
            accuracy: Math.random() * 10 + 85,
            teamCount: Math.floor(Math.random() * 5) + 2,
            varianceCost: Math.floor(Math.random() * 3000) + 1000
          };
        }).reverse()
      };
    };

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

    const financial = calculateFinancialMetrics();
    const teamPerformance = calculateTeamPerformance();
    const recentComparisons = calculateCountComparisons();
    const chartData = generateChartData();

    const metrics: EnhancedAnalyticsMetrics = {
      accuracyRate,
      averageCompletionTime,
      totalVariances,
      trendDirection,
      monthlyComparison,
      financial,
      teamPerformance,
      recentComparisons
    };

    return { metrics, chartData };
  }, [counts, alerts, items, transactions]);

  return analytics;
};
