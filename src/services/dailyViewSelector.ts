/**
 * Central data selector for Daily View to ensure cards, totals, and table all use same data source
 */

export type DailyViewData = {
  context: {
    dateLocalISO: string;
    timezone: string;
    teamIds: string[] | 'all';
    varianceThreshold?: number;
  };
  summary: {
    totalValueCounted: number;
    itemsProcessed: number;
    varianceCost: number;
    accuracyRatePct: number;
    avgCompletionHours: number;
    completedCounts: number;
    activeTeams: number;
    performanceGrade: string;
  };
  totalsRibbon: {
    totalItems: number;
    counted: number;
    totalValue: number;
    costImpact: number;
    minMaxViolations: number;
    withVariances: number;
  };
  table: { 
    items: any[];
    loading: boolean;
    summary: any;
  };
  actionItems: { 
    reorderCount: number; 
    varianceCount: number; 
  };
};

/**
 * Build unified daily view data from analytics hook result
 * This ensures all components (cards, table, totals) use the same filtered data
 */
export function buildDailyViewData({
  analytics,
  timezone,
  selectedDate,
  teamIds,
  varianceThreshold
}: {
  analytics: {
    metrics: any;
    chartData: any;
    itemsData: any;
  };
  timezone: string;
  selectedDate: Date;
  teamIds: string[] | 'all';
  varianceThreshold?: number;
}): DailyViewData {
  const { metrics, itemsData } = analytics;
  
  // Use itemsData.summary for more accurate totals when available
  const useDetailedData = itemsData?.summary;
  
  // Calculate performance grade
  const getPerformanceGrade = (accuracyRate: number): string => {
    if (accuracyRate >= 95) return 'A+';
    if (accuracyRate >= 85) return 'B';
    if (accuracyRate >= 75) return 'C';
    return 'D';
  };

  // Build summary using the most accurate data source
  const summary = {
    totalValueCounted: useDetailedData ? itemsData.summary.totalValue : metrics.totalValue,
    itemsProcessed: useDetailedData ? itemsData.summary.totalItems : metrics.totalItemsCounted,
    varianceCost: useDetailedData ? itemsData.summary.totalVarianceCost : metrics.totalVarianceCost,
    accuracyRatePct: metrics.accuracyRate / 100, // Convert to decimal for consistency
    avgCompletionHours: metrics.averageCompletionTime,
    completedCounts: metrics.completedCounts,
    activeTeams: metrics.activeTeams,
    performanceGrade: getPerformanceGrade(metrics.accuracyRate)
  };

  // Build totals ribbon (same data as summary, different structure for compatibility)
  const totalsRibbon = {
    totalItems: summary.itemsProcessed,
    counted: useDetailedData ? itemsData.summary.countedItems : summary.itemsProcessed,
    totalValue: summary.totalValueCounted,
    costImpact: summary.varianceCost,
    minMaxViolations: useDetailedData ? 
      (itemsData.summary.stockIssues.underStock + itemsData.summary.stockIssues.overStock) : 0,
    withVariances: useDetailedData ? itemsData.summary.totalVariances : 0
  };

  // Action items for attention/alerts
  const actionItems = {
    reorderCount: useDetailedData ? 
      (itemsData.summary.stockIssues.underStock + itemsData.summary.stockIssues.outOfStock) : 0,
    varianceCount: useDetailedData ? itemsData.summary.totalVariances : 0
  };

  return {
    context: {
      dateLocalISO: selectedDate.toISOString(),
      timezone,
      teamIds,
      varianceThreshold
    },
    summary,
    totalsRibbon,
    table: itemsData, // Pass through the itemsData directly for table
    actionItems
  };
}