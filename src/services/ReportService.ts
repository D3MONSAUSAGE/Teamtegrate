import { exportService, ExportOptions } from './ExportService';
import { analyticsService } from './AnalyticsService';
import { useSalesManager } from '@/hooks/useSalesManager';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface ReportTemplate {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string;
  generateFunction: (options?: ReportGenerationOptions) => Promise<Blob>;
  previewFunction: (options?: ReportGenerationOptions) => Promise<ReportPreview>;
}

export interface ReportGenerationOptions {
  format?: 'pdf' | 'csv' | 'excel' | 'json';
  dateRange?: { start: Date; end: Date };
  teamId?: string;
  includeCharts?: boolean;
  includeInsights?: boolean;
}

export interface ReportPreview {
  title: string;
  summary: string;
  keyMetrics: Array<{
    label: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down' | 'stable';
  }>;
  chartData?: any[];
  insights?: string[];
}

class ReportService {
  private static instance: ReportService;

  static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  async generateWeeklySalesReport(options: ReportGenerationOptions = {}): Promise<Blob> {
    const defaultOptions: ExportOptions = {
      format: options.format || 'pdf',
      includeCharts: options.includeCharts ?? true,
      includeInsights: options.includeInsights ?? true,
      dateRange: options.dateRange || {
        start: startOfWeek(new Date()),
        end: endOfWeek(new Date())
      },
      teamId: options.teamId
    };

    // Get sales data for the week
    const salesData = await this.getSalesData(defaultOptions.dateRange!, defaultOptions.teamId);
    
    return await exportService.exportSalesData(salesData, defaultOptions);
  }

  async generateMonthlePLReport(options: ReportGenerationOptions = {}): Promise<Blob> {
    const defaultOptions: ExportOptions = {
      format: options.format || 'pdf',
      includeInsights: options.includeInsights ?? true,
      dateRange: options.dateRange || {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
      },
      teamId: options.teamId
    };

    // Get comprehensive data for P&L
    const salesData = await this.getSalesData(defaultOptions.dateRange!, defaultOptions.teamId);
    const kpiMetrics = await analyticsService.getKPIMetrics(defaultOptions.dateRange!, defaultOptions.teamId);
    const insights = await analyticsService.getPerformanceInsights(defaultOptions.dateRange!, defaultOptions.teamId);
    
    return await exportService.exportAnalyticsReport(kpiMetrics, insights, defaultOptions);
  }

  async generateDailySalesDashboard(options: ReportGenerationOptions = {}): Promise<Blob> {
    const yesterday = subDays(new Date(), 1);
    const defaultOptions: ExportOptions = {
      format: options.format || 'pdf',
      includeCharts: options.includeCharts ?? true,
      dateRange: options.dateRange || {
        start: yesterday,
        end: yesterday
      },
      teamId: options.teamId
    };

    const salesData = await this.getSalesData(defaultOptions.dateRange!, defaultOptions.teamId);
    
    return await exportService.exportSalesData(salesData, defaultOptions);
  }

  async generateSalesTrendsAnalysis(options: ReportGenerationOptions = {}): Promise<Blob> {
    const defaultOptions: ExportOptions = {
      format: options.format || 'pdf',
      includeCharts: options.includeCharts ?? true,
      includeInsights: options.includeInsights ?? true,
      dateRange: options.dateRange || {
        start: subDays(new Date(), 30),
        end: new Date()
      },
      teamId: options.teamId
    };

    const kpiMetrics = await analyticsService.getKPIMetrics(defaultOptions.dateRange!, defaultOptions.teamId);
    const insights = await analyticsService.getPerformanceInsights(defaultOptions.dateRange!, defaultOptions.teamId);
    
    return await exportService.exportAnalyticsReport(kpiMetrics, insights, defaultOptions);
  }

  async generatePaymentMethodsReport(options: ReportGenerationOptions = {}): Promise<Blob> {
    const defaultOptions: ExportOptions = {
      format: options.format || 'pdf',
      includeCharts: options.includeCharts ?? true,
      dateRange: options.dateRange || {
        start: startOfWeek(new Date()),
        end: endOfWeek(new Date())
      },
      teamId: options.teamId
    };

    const salesData = await this.getSalesData(defaultOptions.dateRange!, defaultOptions.teamId);
    
    return await exportService.exportSalesData(salesData, defaultOptions);
  }

  async generateTaxSummaryReport(options: ReportGenerationOptions = {}): Promise<Blob> {
    const defaultOptions: ExportOptions = {
      format: options.format || 'pdf',
      dateRange: options.dateRange || {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
      },
      teamId: options.teamId
    };

    const salesData = await this.getSalesData(defaultOptions.dateRange!, defaultOptions.teamId);
    
    return await exportService.exportSalesData(salesData, defaultOptions);
  }

  // Preview functions
  async previewWeeklySalesReport(options: ReportGenerationOptions = {}): Promise<ReportPreview> {
    const dateRange = options.dateRange || {
      start: startOfWeek(new Date()),
      end: endOfWeek(new Date())
    };

    const kpiMetrics = await analyticsService.getKPIMetrics(dateRange, options.teamId);
    const insights = await analyticsService.getPerformanceInsights(dateRange, options.teamId);

    return {
      title: `Weekly Sales Summary - ${format(dateRange.start, 'MMM dd')} to ${format(dateRange.end, 'MMM dd')}`,
      summary: `Comprehensive weekly sales performance report including revenue breakdown, trend analysis, and location comparison.`,
      keyMetrics: [
        {
          label: 'Gross Sales',
          value: `$${kpiMetrics.grossSales.toFixed(2)}`,
          change: `${kpiMetrics.periodComparison.grossSalesChange >= 0 ? '+' : ''}${kpiMetrics.periodComparison.grossSalesChange.toFixed(1)}%`,
          trend: kpiMetrics.periodComparison.grossSalesChange >= 0 ? 'up' : 'down'
        },
        {
          label: 'Order Count',
          value: kpiMetrics.orderCount.toString(),
          change: `${kpiMetrics.periodComparison.orderCountChange >= 0 ? '+' : ''}${kpiMetrics.periodComparison.orderCountChange.toFixed(1)}%`,
          trend: kpiMetrics.periodComparison.orderCountChange >= 0 ? 'up' : 'down'
        },
        {
          label: 'Average Order',
          value: `$${kpiMetrics.averageOrderValue.toFixed(2)}`,
          change: `${kpiMetrics.periodComparison.averageOrderValueChange >= 0 ? '+' : ''}${kpiMetrics.periodComparison.averageOrderValueChange.toFixed(1)}%`,
          trend: kpiMetrics.periodComparison.averageOrderValueChange >= 0 ? 'up' : 'down'
        }
      ],
      insights: insights.map(insight => insight.title)
    };
  }

  async previewMonthlePLReport(options: ReportGenerationOptions = {}): Promise<ReportPreview> {
    const dateRange = options.dateRange || {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    };

    const kpiMetrics = await analyticsService.getKPIMetrics(dateRange, options.teamId);

    return {
      title: `Monthly P&L Statement - ${format(dateRange.start, 'MMMM yyyy')}`,
      summary: `Detailed profit and loss statement including income statement, expense tracking, and margin analysis.`,
      keyMetrics: [
        {
          label: 'Net Sales',
          value: `$${kpiMetrics.netSales.toFixed(2)}`,
          change: `${kpiMetrics.periodComparison.netSalesChange >= 0 ? '+' : ''}${kpiMetrics.periodComparison.netSalesChange.toFixed(1)}%`,
          trend: kpiMetrics.periodComparison.netSalesChange >= 0 ? 'up' : 'down'
        },
        {
          label: 'Labor Cost %',
          value: `${kpiMetrics.laborCostPercentage.toFixed(1)}%`,
          trend: kpiMetrics.laborCostPercentage > 30 ? 'down' : 'up'
        }
      ],
      insights: ['Complete financial overview', 'Expense breakdown', 'Margin analysis']
    };
  }

  async previewDailySalesDashboard(options: ReportGenerationOptions = {}): Promise<ReportPreview> {
    const yesterday = subDays(new Date(), 1);
    const dateRange = options.dateRange || { start: yesterday, end: yesterday };

    return {
      title: `Daily Sales Dashboard - ${format(dateRange.start, 'MMM dd, yyyy')}`,
      summary: `Real-time daily sales metrics and performance indicators with live data updates.`,
      keyMetrics: [
        { label: 'Live Updates', value: 'Enabled' },
        { label: 'Report Type', value: 'Dashboard view' }
      ],
      insights: ['Hourly breakdown available', 'Staff performance metrics', 'Real-time alerts']
    };
  }

  private async getSalesData(dateRange: { start: Date; end: Date }, teamId?: string) {
    // Import the sales data service to get real data
    const { salesDataService } = await import('@/services/SalesDataService');
    
    try {
      const data = await salesDataService.fetchSalesData({
        date_from: dateRange.start.toISOString().split('T')[0],
        date_to: dateRange.end.toISOString().split('T')[0],
        team_id: teamId && teamId !== 'all' ? teamId : undefined
      });
      return data;
    } catch (error) {
      console.error('[ReportService] Error fetching sales data:', error);
      return [];
    }
  }

  getReportTemplates(): ReportTemplate[] {
    return [
      {
        id: 1,
        title: 'Weekly Sales Summary',
        description: 'Complete overview of weekly sales performance with key metrics',
        category: 'sales',
        type: 'summary',
        generateFunction: (options) => this.generateWeeklySalesReport(options),
        previewFunction: (options) => this.previewWeeklySalesReport(options)
      },
      {
        id: 2,
        title: 'Monthly P&L Statement',
        description: 'Detailed profit and loss statement for monthly reporting',
        category: 'financial',
        type: 'detailed',
        generateFunction: (options) => this.generateMonthlePLReport(options),
        previewFunction: (options) => this.previewMonthlePLReport(options)
      },
      {
        id: 3,
        title: 'Daily Sales Dashboard',
        description: 'Real-time daily sales metrics and performance indicators',
        category: 'analytics',
        type: 'dashboard',
        generateFunction: (options) => this.generateDailySalesDashboard(options),
        previewFunction: (options) => this.previewDailySalesDashboard(options)
      },
      {
        id: 4,
        title: 'Sales Trends Analysis',
        description: 'Advanced analytics showing sales patterns and forecasts',
        category: 'analytics',
        type: 'analysis',
        generateFunction: (options) => this.generateSalesTrendsAnalysis(options),
        previewFunction: (options) => this.previewWeeklySalesReport(options) // Reuse for now
      },
      {
        id: 5,
        title: 'Payment Methods Report',
        description: 'Breakdown of payment methods and transaction types',
        category: 'sales',
        type: 'breakdown',
        generateFunction: (options) => this.generatePaymentMethodsReport(options),
        previewFunction: (options) => this.previewWeeklySalesReport(options) // Reuse for now
      },
      {
        id: 6,
        title: 'Tax Summary Report',
        description: 'Comprehensive tax information for compliance reporting',
        category: 'financial',
        type: 'compliance',
        generateFunction: (options) => this.generateTaxSummaryReport(options),
        previewFunction: (options) => this.previewMonthlePLReport(options) // Reuse for now
      }
    ];
  }
}

export const reportService = ReportService.getInstance();