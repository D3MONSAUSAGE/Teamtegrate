import { useMemo } from 'react';
import { format } from 'date-fns';
import { InventoryCount, InventoryCountItem, InventoryItem } from '@/contexts/inventory/types';
import { getStockStatus } from '@/utils/stockStatus';

export type InventoryExportType = 'detailed' | 'summary' | 'exceptions' | 'team-performance' | 'financial-impact';

export interface InventoryExportOptions {
  type: InventoryExportType;
  countId?: string;
  teamId?: string;
  varianceThreshold?: number;
  includeFinancials: boolean;
  includeStockAnalysis: boolean;
}

export interface InventoryExportData {
  filename: string;
  headers: string[];
  rows: string[][];
  metadata: {
    exportType: string;
    countDate: string;
    teamName: string;
    totalItems: number;
    totalVarianceCost: number;
    criticalItems: number;
    generatedAt: string;
  };
}

export interface EnhancedInventoryItem extends InventoryCountItem {
  item: InventoryItem;
  preCountStock: number;
  varianceQuantity: number;
  variancePercentage: number;
  varianceCost: number;
  totalPreCountValue: number;
  totalActualValue: number;
  stockStatus: ReturnType<typeof getStockStatus>;
  varianceCategory: 'acceptable' | 'minor' | 'significant' | 'critical';
  requiresAttention: boolean;
}

export const useInventoryCountExport = (
  counts: InventoryCount[],
  countItems: InventoryCountItem[],
  inventoryItems: InventoryItem[],
  options: InventoryExportOptions
): InventoryExportData => {
  return useMemo(() => {
    const { type, countId, teamId, varianceThreshold = 5, includeFinancials, includeStockAnalysis } = options;

    // Filter data based on options
    let filteredCounts = counts;
    if (countId) {
      filteredCounts = counts.filter(count => count.id === countId);
    }
    if (teamId) {
      filteredCounts = filteredCounts.filter(count => count.team_id === teamId);
    }

    // Get relevant count items (since countItems are not provided in context, we'll use empty array)
    const relevantCountIds = filteredCounts.map(count => count.id);
    let filteredCountItems: InventoryCountItem[] = []; // Will be empty until we add countItems to context

    // Enhance count items with additional analysis
    const enhancedItems: EnhancedInventoryItem[] = filteredCountItems.map(countItem => {
      const item = inventoryItems.find(inv => inv.id === countItem.item_id);
      if (!item) return null;

      const preCountStock = item.current_stock || 0;
      const actualQuantity = countItem.actual_quantity || 0;
      const varianceQuantity = actualQuantity - preCountStock;
      const variancePercentage = preCountStock > 0 ? Math.abs((varianceQuantity / preCountStock) * 100) : 0;
      
      const unitCost = item.unit_cost || 0;
      const varianceCost = varianceQuantity * unitCost;
      const totalPreCountValue = preCountStock * unitCost;
      const totalActualValue = actualQuantity * unitCost;

      const stockStatus = getStockStatus(
        actualQuantity,
        item.minimum_threshold,
        item.maximum_threshold
      );

      // Categorize variance severity
      let varianceCategory: 'acceptable' | 'minor' | 'significant' | 'critical';
      if (variancePercentage <= 5) varianceCategory = 'acceptable';
      else if (variancePercentage <= 15) varianceCategory = 'minor';
      else if (variancePercentage <= 25) varianceCategory = 'significant';
      else varianceCategory = 'critical';

      const requiresAttention = varianceCategory === 'critical' || 
                               stockStatus.status === 'under_stock' || 
                               stockStatus.status === 'over_stock' ||
                               Math.abs(varianceCost) > 100;

      return {
        ...countItem,
        item,
        preCountStock,
        varianceQuantity,
        variancePercentage,
        varianceCost,
        totalPreCountValue,
        totalActualValue,
        stockStatus,
        varianceCategory,
        requiresAttention
      };
    }).filter(Boolean) as EnhancedInventoryItem[];

    const generateExportData = (): { headers: string[], rows: string[][] } => {
      switch (type) {
        case 'detailed':
          return generateDetailedExport(enhancedItems, includeFinancials, includeStockAnalysis);
        case 'summary':
          return generateSummaryExport(enhancedItems, filteredCounts);
        case 'exceptions':
          return generateExceptionsExport(enhancedItems.filter(item => item.requiresAttention));
        case 'team-performance':
          return generateTeamPerformanceExport(enhancedItems, filteredCounts);
        case 'financial-impact':
          return generateFinancialImpactExport(enhancedItems);
        default:
          return generateDetailedExport(enhancedItems, includeFinancials, includeStockAnalysis);
      }
    };

    const { headers, rows } = generateExportData();

    // Calculate metadata
    const totalVarianceCost = enhancedItems.reduce((sum, item) => sum + Math.abs(item.varianceCost), 0);
    const criticalItems = enhancedItems.filter(item => item.requiresAttention).length;
    const countDate = filteredCounts[0]?.created_at ? format(new Date(filteredCounts[0].created_at), 'yyyy-MM-dd') : 'Multiple Dates';
    const teamName = teamId ? `Team ${teamId}` : 'All Teams';

    // Generate filename
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const teamStr = teamId ? `-${teamName.replace(/\s+/g, '-')}` : '';
    const filename = `inventory-${type}-export${teamStr}-${dateStr}.csv`;

    const metadata = {
      exportType: type,
      countDate,
      teamName,
      totalItems: enhancedItems.length,
      totalVarianceCost,
      criticalItems,
      generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };

    return {
      filename,
      headers,
      rows,
      metadata
    };
  }, [counts, countItems, inventoryItems, options]);
};

const generateDetailedExport = (
  items: EnhancedInventoryItem[],
  includeFinancials: boolean,
  includeStockAnalysis: boolean
): { headers: string[], rows: string[][] } => {
  const baseHeaders = [
    'Item Name',
    'SKU',
    'Category',
    'Location',
    'Unit of Measure',
    'Pre-Count Stock',
    'Actual Count',
    'Variance Qty',
    'Variance %',
    'Count Date',
    'Counted By',
    'Notes'
  ];

  const financialHeaders = includeFinancials ? [
    'Unit Cost',
    'Pre-Count Value',
    'Actual Value',
    'Variance Cost',
    'Purchase Price'
  ] : [];

  const stockHeaders = includeStockAnalysis ? [
    'Min Threshold',
    'Max Threshold',
    'Stock Status',
    'Variance Category',
    'Requires Attention'
  ] : [];

  const headers = [...baseHeaders, ...financialHeaders, ...stockHeaders];

  const rows = items.map(item => {
    const baseRow = [
      item.item.name,
      item.item.sku || 'N/A',
      item.item.category?.name || 'Uncategorized',
      item.item.location || 'N/A',
      item.item.base_unit?.name || 'units',
      item.preCountStock.toString(),
      (item.actual_quantity || 0).toString(),
      item.varianceQuantity.toString(),
      `${item.variancePercentage.toFixed(1)}%`,
      item.counted_at ? format(new Date(item.counted_at), 'yyyy-MM-dd HH:mm') : 'N/A',
      item.counted_by || 'Unknown',
      item.notes || ''
    ];

    const financialRow = includeFinancials ? [
      `$${(item.item.unit_cost || 0).toFixed(2)}`,
      `$${item.totalPreCountValue.toFixed(2)}`,
      `$${item.totalActualValue.toFixed(2)}`,
      `$${item.varianceCost.toFixed(2)}`,
      `$${(item.item.purchase_price || 0).toFixed(2)}`
    ] : [];

    const stockRow = includeStockAnalysis ? [
      (item.item.minimum_threshold || 0).toString(),
      (item.item.maximum_threshold || 0).toString(),
      item.stockStatus.message,
      item.varianceCategory.charAt(0).toUpperCase() + item.varianceCategory.slice(1),
      item.requiresAttention ? 'Yes' : 'No'
    ] : [];

    return [...baseRow, ...financialRow, ...stockRow];
  });

  return { headers, rows };
};

const generateSummaryExport = (
  items: EnhancedInventoryItem[],
  counts: InventoryCount[]
): { headers: string[], rows: string[][] } => {
  const headers = ['Metric', 'Value'];
  
  const totalItems = items.length;
  const totalVarianceCost = items.reduce((sum, item) => sum + Math.abs(item.varianceCost), 0);
  const positiveVarianceCost = items.reduce((sum, item) => sum + (item.varianceCost > 0 ? item.varianceCost : 0), 0);
  const negativeVarianceCost = items.reduce((sum, item) => sum + (item.varianceCost < 0 ? Math.abs(item.varianceCost) : 0), 0);
  const totalPreCountValue = items.reduce((sum, item) => sum + item.totalPreCountValue, 0);
  const totalActualValue = items.reduce((sum, item) => sum + item.totalActualValue, 0);
  
  const acceptableVariance = items.filter(item => item.varianceCategory === 'acceptable').length;
  const minorVariance = items.filter(item => item.varianceCategory === 'minor').length;
  const significantVariance = items.filter(item => item.varianceCategory === 'significant').length;
  const criticalVariance = items.filter(item => item.varianceCategory === 'critical').length;
  
  const underStock = items.filter(item => item.stockStatus.status === 'under_stock').length;
  const overStock = items.filter(item => item.stockStatus.status === 'over_stock').length;
  const normalStock = items.filter(item => item.stockStatus.status === 'normal_stock').length;

  const rows = [
    ['Total Items Counted', totalItems.toString()],
    ['Total Pre-Count Value', `$${totalPreCountValue.toFixed(2)}`],
    ['Total Actual Value', `$${totalActualValue.toFixed(2)}`],
    ['Total Variance Cost', `$${totalVarianceCost.toFixed(2)}`],
    ['Positive Variance Cost', `$${positiveVarianceCost.toFixed(2)}`],
    ['Negative Variance Cost', `$${negativeVarianceCost.toFixed(2)}`],
    ['', ''],
    ['Variance Analysis', ''],
    ['Acceptable Variance (≤5%)', acceptableVariance.toString()],
    ['Minor Variance (5-15%)', minorVariance.toString()],
    ['Significant Variance (15-25%)', significantVariance.toString()],
    ['Critical Variance (>25%)', criticalVariance.toString()],
    ['', ''],
    ['Stock Level Analysis', ''],
    ['Under Stock Items', underStock.toString()],
    ['Over Stock Items', overStock.toString()],
    ['Normal Stock Items', normalStock.toString()],
    ['', ''],
    ['Count Information', ''],
    ['Number of Counts', counts.length.toString()],
    ['Count Dates', counts.map(c => format(new Date(c.created_at), 'MM/dd/yyyy')).join(', ')]
  ];

  return { headers, rows };
};

const generateExceptionsExport = (
  items: EnhancedInventoryItem[]
): { headers: string[], rows: string[][] } => {
  const headers = [
    'Item Name',
    'SKU',
    'Issue Type',
    'Pre-Count Stock',
    'Actual Count',
    'Variance',
    'Variance Cost',
    'Stock Status',
    'Action Required'
  ];

  const rows = items.map(item => {
    let issueType = '';
    let actionRequired = '';

    if (item.varianceCategory === 'critical') {
      issueType = 'Critical Variance';
      actionRequired = 'Investigate count accuracy';
    } else if (item.stockStatus.status === 'under_stock') {
      issueType = 'Critical Shortage';
      actionRequired = 'Reorder immediately';
    } else if (item.stockStatus.status === 'over_stock') {
      issueType = 'Overstock';
      actionRequired = 'Review ordering patterns';
    } else if (Math.abs(item.varianceCost) > 100) {
      issueType = 'High Financial Impact';
      actionRequired = 'Verify count and investigate';
    }

    return [
      item.item.name,
      item.item.sku || 'N/A',
      issueType,
      item.preCountStock.toString(),
      (item.actual_quantity || 0).toString(),
      item.varianceQuantity.toString(),
      `$${item.varianceCost.toFixed(2)}`,
      item.stockStatus.message,
      actionRequired
    ];
  });

  return { headers, rows };
};

const generateTeamPerformanceExport = (
  items: EnhancedInventoryItem[],
  counts: InventoryCount[]
): { headers: string[], rows: string[][] } => {
  const headers = [
    'Team ID',
    'Items Counted',
    'Accuracy Rate',
    'Avg Variance %',
    'Total Variance Cost',
    'Critical Items',
    'Count Completion Time',
    'Performance Rating'
  ];

  // Group by team_id from counts
  const teamIds = [...new Set(counts.map(count => count.team_id).filter(Boolean))];
  
  const teamStats = teamIds.map(teamId => {
    const teamCounts = counts.filter(count => count.team_id === teamId);
    const teamItems = items.filter(item => teamCounts.some(count => count.id === item.count_id));
    
    const totalItems = teamItems.length;
    const acceptableItems = teamItems.filter(item => item.varianceCategory === 'acceptable').length;
    const accuracyRate = totalItems > 0 ? (acceptableItems / totalItems) * 100 : 0;
    const avgVariancePercent = totalItems > 0 
      ? teamItems.reduce((sum, item) => sum + item.variancePercentage, 0) / totalItems 
      : 0;
    const totalVarianceCost = teamItems.reduce((sum, item) => sum + Math.abs(item.varianceCost), 0);
    const criticalItems = teamItems.filter(item => item.varianceCategory === 'critical').length;
    
    let performanceRating = 'Excellent';
    if (accuracyRate < 70) performanceRating = 'Needs Improvement';
    else if (accuracyRate < 85) performanceRating = 'Good';
    else if (accuracyRate < 95) performanceRating = 'Very Good';

    return [
      teamId || 'Unknown',
      totalItems.toString(),
      `${accuracyRate.toFixed(1)}%`,
      `${avgVariancePercent.toFixed(1)}%`,
      `$${totalVarianceCost.toFixed(2)}`,
      criticalItems.toString(),
      'N/A', // TODO: Calculate based on count timestamps
      performanceRating
    ];
  }).filter(row => parseInt(row[1]) > 0);

  return { headers, rows: teamStats };
};

const generateFinancialImpactExport = (
  items: EnhancedInventoryItem[]
): { headers: string[], rows: string[][] } => {
  const headers = [
    'Item Name',
    'Category',
    'Pre-Count Value',
    'Actual Value',
    'Variance Cost',
    'Impact Level',
    'Cumulative Impact',
    'Percentage of Total'
  ];

  // Sort by absolute variance cost descending
  const sortedItems = [...items].sort((a, b) => Math.abs(b.varianceCost) - Math.abs(a.varianceCost));
  const totalVarianceCost = items.reduce((sum, item) => sum + Math.abs(item.varianceCost), 0);
  
  let cumulativeImpact = 0;
  const rows = sortedItems.map(item => {
    cumulativeImpact += Math.abs(item.varianceCost);
    const percentageOfTotal = totalVarianceCost > 0 ? (Math.abs(item.varianceCost) / totalVarianceCost) * 100 : 0;
    
    let impactLevel = 'Low';
    if (Math.abs(item.varianceCost) > 500) impactLevel = 'Critical';
    else if (Math.abs(item.varianceCost) > 100) impactLevel = 'High';
    else if (Math.abs(item.varianceCost) > 25) impactLevel = 'Medium';

    return [
      item.item.name,
      item.item.category?.name || 'Uncategorized',
      `$${item.totalPreCountValue.toFixed(2)}`,
      `$${item.totalActualValue.toFixed(2)}`,
      `$${item.varianceCost.toFixed(2)}`,
      impactLevel,
      `$${cumulativeImpact.toFixed(2)}`,
      `${percentageOfTotal.toFixed(1)}%`
    ];
  });

  return { headers, rows };
};