import { useMemo, useState, useEffect } from 'react';
import { InventoryCount, InventoryAlert, InventoryItem, InventoryTransaction, InventoryCountItem } from '@/contexts/inventory/types';
import { format, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { inventoryCountsApi } from '@/contexts/inventory/api';

export interface SessionChip {
  id: string;
  name?: string;
  status: 'in_progress' | 'completed' | 'voided';
  startedAt: string;
  teamId?: string;
}

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

export interface DailyItemDetail extends InventoryCountItem {
  item_name?: string;
  item_sku?: string;
  item_barcode?: string;
  category_name?: string;
  location?: string;
  unit_cost?: number;
  minimum_threshold?: number;
  maximum_threshold?: number;
  variance_quantity: number;
  variance_cost: number;
  stock_status: 'normal' | 'low' | 'out' | 'over';
  total_value: number;
  // Session metadata
  count_id: string;
  count_name?: string;
  count_status: 'in_progress' | 'completed' | 'voided';
  count_started_at: string;
  team_id?: string;
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

export interface DailyItemsData {
  items: DailyItemDetail[];
  loading: boolean;
  summary: {
    totalItems: number;
    countedItems: number;
    totalVariances: number;
    totalValue: number;
    totalVarianceCost: number;
    stockIssues: {
      underStock: number;
      overStock: number;
      outOfStock: number;
    };
  };
}

export const useDailyInventoryAnalytics = (
  counts: InventoryCount[],
  alerts: InventoryAlert[],
  items: InventoryItem[],
  transactions: InventoryTransaction[],
  selectedDate: Date,
  selectedTeamId?: string,
  selectedSessions?: Set<string>,
  includeVoided: boolean = false,
  showOnlyCountedItems: boolean = false
) => {
  const [itemsData, setItemsData] = useState<DailyItemsData>({
    items: [],
    loading: false,
    summary: {
      totalItems: 0,
      countedItems: 0,
      totalVariances: 0,
      totalValue: 0,
      totalVarianceCost: 0,
      stockIssues: {
        underStock: 0,
        overStock: 0,
        outOfStock: 0,
      },
    },
  });

  // Generate session chips from daily counts
  const sessionChips = useMemo(() => {
    const dailyCounts = counts.filter(count => {
      const matchesDate = isSameDay(new Date(count.count_date), selectedDate);
      const matchesTeam = !selectedTeamId || count.team_id === selectedTeamId;
      const matchesVoided = includeVoided || !count.is_voided;
      return matchesDate && matchesTeam && matchesVoided;
    });

    return dailyCounts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(count => ({
        id: count.id,
        name: count.notes,
        status: count.is_voided ? 'voided' as const : count.status as 'in_progress' | 'completed',
        startedAt: count.created_at,
        teamId: count.team_id
      }));
  }, [counts, selectedDate, selectedTeamId, includeVoided]);

  const analytics = useMemo(() => {
    // Filter counts for the selected date based on session selection and voided state
    const dailyCounts = counts.filter(count => {
      const matchesDate = isSameDay(new Date(count.count_date), selectedDate);
      const matchesTeam = !selectedTeamId || count.team_id === selectedTeamId;
      const matchesVoided = includeVoided || !count.is_voided;
      
      // Filter by selected sessions
      const matchesSession = !selectedSessions || selectedSessions.size === 0 || 
        selectedSessions.has('COMBINE') || selectedSessions.has(count.id);
      
      return matchesDate && matchesTeam && matchesVoided && matchesSession;
    });

    // Filter transactions for the selected date and team
    const dailyTransactions = transactions.filter(transaction => {
      if (!isSameDay(new Date(transaction.transaction_date), selectedDate)) return false;
      
      // If team is selected, only include transactions from counts made by that team
      if (selectedTeamId) {
        const associatedCount = counts.find(count => 
          count.team_id === selectedTeamId && 
          isSameDay(new Date(count.count_date), selectedDate)
        );
        return !!associatedCount;
      }
      
      return true;
    });

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
  }, [counts, alerts, items, transactions, selectedDate, selectedTeamId, selectedSessions, includeVoided]);

  // Fetch detailed item data for the selected date and team
  useEffect(() => {
    const loadItemsData = async () => {
      const dailyCounts = counts.filter(count => {
        const matchesDate = isSameDay(new Date(count.count_date), selectedDate);
        const matchesTeam = !selectedTeamId || count.team_id === selectedTeamId;
        const matchesVoided = includeVoided || !count.is_voided;
        
        // Filter by selected sessions
        const matchesSession = !selectedSessions || selectedSessions.size === 0 || 
          selectedSessions.has('COMBINE') || selectedSessions.has(count.id);
        
        return matchesDate && matchesTeam && matchesVoided && matchesSession;
      });

      if (dailyCounts.length === 0) {
        setItemsData(prev => ({ ...prev, items: [], loading: false }));
        return;
      }

      setItemsData(prev => ({ ...prev, loading: true }));

      try {
        // Fetch count items for all daily counts (excluding voided counts)
        const allCountItems: DailyItemDetail[] = [];
        
        for (const count of dailyCounts) {
          // Skip voided counts if not including them
          if (count.is_voided && !includeVoided) continue;
          
          const countItems = await inventoryCountsApi.getCountItems(count.id);
          
          const processedItems = countItems.map((item): DailyItemDetail => {
            const inventoryItem = items.find(i => i.id === item.item_id);
            const unitCost = inventoryItem?.unit_cost || inventoryItem?.purchase_price || 15;
            const actualQuantity = item.actual_quantity ?? 0;
            const inStockQuantity = item.in_stock_quantity ?? 0;
            const varianceQuantity = actualQuantity - inStockQuantity;
            const varianceCost = Math.abs(varianceQuantity) * unitCost;
            const totalValue = actualQuantity * unitCost;

            // Determine stock status
            let stockStatus: 'normal' | 'low' | 'out' | 'over' = 'normal';
            const minThreshold = inventoryItem?.minimum_threshold || item.template_minimum_quantity;
            const maxThreshold = inventoryItem?.maximum_threshold || item.template_maximum_quantity;
            
            if (actualQuantity === 0) {
              stockStatus = 'out';
            } else if (minThreshold && actualQuantity < minThreshold) {
              stockStatus = 'low';
            } else if (maxThreshold && actualQuantity > maxThreshold) {
              stockStatus = 'over';
            }

            return {
              ...item,
              item_name: inventoryItem?.name || `Item ${item.item_id.slice(0, 8)}`,
              item_sku: inventoryItem?.sku,
              item_barcode: inventoryItem?.barcode,
              category_name: inventoryItem?.category?.name || 'Uncategorized',
              location: inventoryItem?.location,
              unit_cost: unitCost,
              minimum_threshold: inventoryItem?.minimum_threshold,
              maximum_threshold: inventoryItem?.maximum_threshold,
              variance_quantity: varianceQuantity,
              variance_cost: varianceCost,
              stock_status: stockStatus,
              total_value: totalValue,
              // Session metadata
              count_id: count.id,
              count_name: count.notes,
              count_status: count.is_voided ? 'voided' as const : count.status as 'in_progress' | 'completed',
              count_started_at: count.created_at,
              team_id: count.team_id,
            };
          });

          allCountItems.push(...processedItems);
        }

        // Apply show only counted items filter
        const filteredItems = showOnlyCountedItems 
          ? allCountItems.filter(item => item.actual_quantity !== null && item.actual_quantity !== undefined)
          : allCountItems;

        // Calculate summary
        const totalItems = filteredItems.length;
        const countedItems = filteredItems.filter(item => item.actual_quantity !== null).length;
        const totalVariances = filteredItems.filter(item => 
          Math.abs(item.variance_quantity) > 0.01
        ).length;
        const totalValue = filteredItems.reduce((sum, item) => sum + item.total_value, 0);
        const totalVarianceCost = filteredItems.reduce((sum, item) => sum + item.variance_cost, 0);
        
        const stockIssues = {
          underStock: filteredItems.filter(item => item.stock_status === 'low').length,
          overStock: filteredItems.filter(item => item.stock_status === 'over').length,
          outOfStock: filteredItems.filter(item => item.stock_status === 'out').length,
        };

        setItemsData({
          items: filteredItems,
          loading: false,
          summary: {
            totalItems,
            countedItems,
            totalVariances,
            totalValue,
            totalVarianceCost,
            stockIssues,
          },
        });
      } catch (error) {
        console.error('Failed to load daily items data:', error);
        setItemsData(prev => ({ ...prev, loading: false }));
      }
    };

    loadItemsData();
  }, [counts, items, selectedDate, selectedTeamId, selectedSessions, includeVoided, showOnlyCountedItems]);

  return { ...analytics, itemsData, sessionChips };
};