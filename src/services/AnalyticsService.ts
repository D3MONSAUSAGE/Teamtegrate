import { supabase } from '@/integrations/supabase/client';
import type { Json, Database } from '@/integrations/supabase/types';
import { SalesData } from '@/types/sales';
import { startOfMonth, endOfMonth, subMonths, format, parseISO, differenceInDays } from 'date-fns';

export interface KPIMetrics {
  grossSales: number;
  netSales: number;
  orderCount: number;
  averageOrderValue: number;
  laborCostPercentage: number;
  tips: number;
  periodComparison: {
    grossSalesChange: number;
    netSalesChange: number;
    orderCountChange: number;
    averageOrderValueChange: number;
  };
}

export interface TrendData {
  date: string;
  grossSales: number;
  netSales: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface PerformanceInsight {
  id: string;
  type: 'opportunity' | 'alert' | 'achievement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  relatedMetric: string;
  value?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface ForecastData {
  date: string;
  predicted: number;
  confidence: number;
  actual?: number;
}

export interface LocationPerformance {
  location: string;
  teamId: string;
  grossSales: number;
  netSales: number;
  orderCount: number;
  averageOrderValue: number;
  efficiency: number; // Orders per hour
  ranking: number;
}

class AnalyticsService {
  async getKPIMetrics(dateRange: { start: Date; end: Date }, teamId?: string): Promise<KPIMetrics> {
    try {
      // Get current period data
      let query = supabase
        .from('sales_data')
        .select('*')
        .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.end, 'yyyy-MM-dd'));

      if (teamId && teamId !== 'all') {
        query = query.eq('team_id', teamId);
      }

      const { data: currentData, error } = await query;
      if (error) throw error;

      // Transform data to match SalesData interface
      const transformedCurrentData = (currentData || []).map(this.transformDbToSalesData);

      // Get comparison period data (same length, previous period)
      const daysDiff = differenceInDays(dateRange.end, dateRange.start);
      const comparisonStart = new Date(dateRange.start);
      comparisonStart.setDate(comparisonStart.getDate() - daysDiff - 1);
      const comparisonEnd = new Date(dateRange.start);
      comparisonEnd.setDate(comparisonEnd.getDate() - 1);

      let comparisonQuery = supabase
        .from('sales_data')
        .select('*')
        .gte('date', format(comparisonStart, 'yyyy-MM-dd'))
        .lte('date', format(comparisonEnd, 'yyyy-MM-dd'));

      if (teamId && teamId !== 'all') {
        comparisonQuery = comparisonQuery.eq('team_id', teamId);
      }

      const { data: comparisonData, error: compError } = await comparisonQuery;
      if (compError) throw compError;

      const transformedComparisonData = (comparisonData || []).map(this.transformDbToSalesData);

      // Calculate current metrics
      const currentMetrics = this.calculateMetrics(transformedCurrentData);
      const comparisonMetrics = this.calculateMetrics(transformedComparisonData);

      return {
        ...currentMetrics,
        periodComparison: {
          grossSalesChange: this.calculatePercentageChange(comparisonMetrics.grossSales, currentMetrics.grossSales),
          netSalesChange: this.calculatePercentageChange(comparisonMetrics.netSales, currentMetrics.netSales),
          orderCountChange: this.calculatePercentageChange(comparisonMetrics.orderCount, currentMetrics.orderCount),
          averageOrderValueChange: this.calculatePercentageChange(comparisonMetrics.averageOrderValue, currentMetrics.averageOrderValue),
        }
      };
    } catch (error) {
      console.error('[AnalyticsService] Error getting KPI metrics:', error);
      return this.getEmptyKPIMetrics();
    }
  }

  async getTrendData(dateRange: { start: Date; end: Date }, teamId?: string): Promise<TrendData[]> {
    try {
      let query = supabase
        .from('sales_data')
        .select('*')
        .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.end, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (teamId && teamId !== 'all') {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform and group by date
      const transformedData = (data || []).map(this.transformDbToSalesData);
      const dailyData = new Map<string, SalesData[]>();
      transformedData.forEach(item => {
        const date = item.date;
        if (!dailyData.has(date)) {
          dailyData.set(date, []);
        }
        dailyData.get(date)!.push(item);
      });

      return Array.from(dailyData.entries()).map(([date, dayData]) => {
        const metrics = this.calculateMetrics(dayData);
        return {
          date,
          grossSales: metrics.grossSales,
          netSales: metrics.netSales,
          orderCount: metrics.orderCount,
          averageOrderValue: metrics.averageOrderValue
        };
      });
    } catch (error) {
      console.error('[AnalyticsService] Error getting trend data:', error);
      return [];
    }
  }

  async getPerformanceInsights(dateRange: { start: Date; end: Date }, teamId?: string): Promise<PerformanceInsight[]> {
    try {
      const kpiMetrics = await this.getKPIMetrics(dateRange, teamId);
      const trendData = await this.getTrendData(dateRange, teamId);
      
      const insights: PerformanceInsight[] = [];

      // Revenue growth insight
      if (kpiMetrics.periodComparison.grossSalesChange > 10) {
        insights.push({
          id: 'revenue-growth',
          type: 'achievement',
          title: 'Strong Revenue Growth',
          description: `Gross sales increased by ${kpiMetrics.periodComparison.grossSalesChange.toFixed(1)}% compared to previous period`,
          impact: 'high',
          actionable: false,
          relatedMetric: 'grossSales',
          value: kpiMetrics.periodComparison.grossSalesChange,
          trend: 'up'
        });
      } else if (kpiMetrics.periodComparison.grossSalesChange < -5) {
        insights.push({
          id: 'revenue-decline',
          type: 'alert',
          title: 'Revenue Decline Alert',
          description: `Gross sales decreased by ${Math.abs(kpiMetrics.periodComparison.grossSalesChange).toFixed(1)}% compared to previous period`,
          impact: 'high',
          actionable: true,
          relatedMetric: 'grossSales',
          value: kpiMetrics.periodComparison.grossSalesChange,
          trend: 'down'
        });
      }

      // Labor cost insight
      if (kpiMetrics.laborCostPercentage > 35) {
        insights.push({
          id: 'high-labor-cost',
          type: 'alert',
          title: 'High Labor Cost Percentage',
          description: `Labor costs are ${kpiMetrics.laborCostPercentage.toFixed(1)}% of sales, consider optimizing staffing`,
          impact: 'medium',
          actionable: true,
          relatedMetric: 'laborCost',
          value: kpiMetrics.laborCostPercentage,
          trend: 'up'
        });
      }

      // Order value insight
      if (kpiMetrics.periodComparison.averageOrderValueChange > 5) {
        insights.push({
          id: 'order-value-growth',
          type: 'achievement',
          title: 'Average Order Value Increase',
          description: `Average order value improved by ${kpiMetrics.periodComparison.averageOrderValueChange.toFixed(1)}%`,
          impact: 'medium',
          actionable: false,
          relatedMetric: 'averageOrderValue',
          value: kpiMetrics.periodComparison.averageOrderValueChange,
          trend: 'up'
        });
      }

      // Trend volatility insight
      if (trendData.length > 7) {
        const volatility = this.calculateVolatility(trendData.map(d => d.grossSales));
        if (volatility > 0.2) {
          insights.push({
            id: 'sales-volatility',
            type: 'opportunity',
            title: 'Sales Volatility Detected',
            description: `Sales patterns show high variability, consider implementing consistent promotional strategies`,
            impact: 'medium',
            actionable: true,
            relatedMetric: 'salesVolatility',
            value: volatility,
            trend: 'stable'
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('[AnalyticsService] Error getting performance insights:', error);
      return [];
    }
  }

  async getForecastData(dateRange: { start: Date; end: Date }, teamId?: string, days: number = 7): Promise<ForecastData[]> {
    try {
      const historicalData = await this.getTrendData({
        start: subMonths(dateRange.start, 3),
        end: dateRange.end
      }, teamId);

      if (historicalData.length < 14) {
        // Not enough data for forecasting
        return [];
      }

      // Simple linear trend forecasting
      const salesData = historicalData.map(d => d.grossSales);
      const trend = this.calculateLinearTrend(salesData);
      const lastDate = new Date(historicalData[historicalData.length - 1].date);
      
      const forecast: ForecastData[] = [];
      for (let i = 1; i <= days; i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(forecastDate.getDate() + i);
        
        const predicted = trend.slope * (historicalData.length + i) + trend.intercept;
        const confidence = Math.max(0.5, 1 - (i * 0.1)); // Decrease confidence over time
        
        forecast.push({
          date: format(forecastDate, 'yyyy-MM-dd'),
          predicted: Math.max(0, predicted),
          confidence
        });
      }

      return forecast;
    } catch (error) {
      console.error('[AnalyticsService] Error getting forecast data:', error);
      return [];
    }
  }

  async getLocationPerformance(dateRange: { start: Date; end: Date }): Promise<LocationPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('sales_data')
        .select('*')
        .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.end, 'yyyy-MM-dd'));

      if (error) throw error;

      // Group by location/team
      const locationData = new Map<string, SalesData[]>();
      (data || []).forEach((item: any) => {
        const sale = this.transformDbToSalesData(item);
        const key = `${sale.location}-${sale.team_id || 'unknown'}`;
        if (!locationData.has(key)) {
          locationData.set(key, []);
        }
        locationData.get(key)!.push(sale);
      });

      const performance = Array.from(locationData.entries()).map(([key, salesData]) => {
        const [location, teamId] = key.split('-');
        const metrics = this.calculateMetrics(salesData);
        
        // Calculate efficiency (orders per day)
        const totalDays = new Set(salesData.map(s => s.date)).size;
        const efficiency = totalDays > 0 ? metrics.orderCount / totalDays : 0;
        
        return {
          location,
          teamId,
          grossSales: metrics.grossSales,
          netSales: metrics.netSales,
          orderCount: metrics.orderCount,
          averageOrderValue: metrics.averageOrderValue,
          efficiency,
          ranking: 0 // Will be set after sorting
        };
      });

      // Sort by gross sales and set rankings
      performance.sort((a, b) => b.grossSales - a.grossSales);
      performance.forEach((item, index) => {
        item.ranking = index + 1;
      });

      return performance;
    } catch (error) {
      console.error('[AnalyticsService] Error getting location performance:', error);
      return [];
    }
  }

  async createAnalyticsSnapshot(dateRange: { start: Date; end: Date }, teamId?: string): Promise<void> {
    try {
      const kpiMetrics = await this.getKPIMetrics(dateRange, teamId);
      const insights = await this.getPerformanceInsights(dateRange, teamId);
      
      const { data: orgId, error: orgError } = await supabase.rpc('get_current_user_organization_id');
      if (orgError) throw orgError;
      if (!orgId) throw new Error('Organization not found');

      const payload: Database['public']['Tables']['analytics_snapshots']['Insert'] = {
        snapshot_type: 'kpi_metrics',
        time_period: `${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}`,
        organization_id: orgId as string,
        metrics_data: ({ kpiMetrics, insights } as unknown) as Json
      };

      const { error } = await supabase
        .from('analytics_snapshots')
        .insert(payload);

      if (error) throw error;
    } catch (error) {
      console.error('[AnalyticsService] Error creating analytics snapshot:', error);
      throw error;
    }
  }

  private calculateMetrics(salesData: SalesData[]): Omit<KPIMetrics, 'periodComparison'> {
    if (salesData.length === 0) {
      return {
        grossSales: 0,
        netSales: 0,
        orderCount: 0,
        averageOrderValue: 0,
        laborCostPercentage: 0,
        tips: 0
      };
    }

    const totals = salesData.reduce((acc, sale) => ({
      grossSales: acc.grossSales + (sale.grossSales || 0),
      netSales: acc.netSales + (sale.netSales || 0),
      orderCount: acc.orderCount + (sale.orderCount || 0),
      laborCost: acc.laborCost + (sale.labor?.cost || 0),
      tips: acc.tips + (sale.paymentBreakdown?.tips || 0)
    }), {
      grossSales: 0,
      netSales: 0,
      orderCount: 0,
      laborCost: 0,
      tips: 0
    });

    return {
      grossSales: totals.grossSales,
      netSales: totals.netSales,
      orderCount: totals.orderCount,
      averageOrderValue: totals.orderCount > 0 ? totals.netSales / totals.orderCount : 0,
      laborCostPercentage: totals.grossSales > 0 ? (totals.laborCost / totals.grossSales) * 100 : 0,
      tips: totals.tips
    };
  }

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    return mean > 0 ? standardDeviation / mean : 0;
  }

  private calculateLinearTrend(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * (index + 1), 0);
    const sumXX = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private transformDbToSalesData(dbRecord: any): SalesData {
    return {
      id: dbRecord.id,
      date: dbRecord.date,
      location: dbRecord.location,
      team_id: dbRecord.team_id,
      grossSales: dbRecord.gross_sales || 0,
      netSales: dbRecord.net_sales || 0,
      orderCount: dbRecord.order_count || 0,
      orderAverage: dbRecord.order_average || 0,
      labor: {
        cost: dbRecord.labor_cost || 0,
        hours: dbRecord.labor_hours || 0,
        percentage: dbRecord.labor_percentage || 0,
        salesPerLaborHour: dbRecord.sales_per_labor_hour || 0
      },
      cashManagement: {
        depositsAccepted: 0,
        depositsRedeemed: 0,
        paidIn: 0,
        paidOut: 0
      },
      giftCards: {
        issueAmount: 0,
        issueCount: 0,
        reloadAmount: 0,
        reloadCount: 0
      },
      paymentBreakdown: {
        nonCash: dbRecord.non_cash || 0,
        totalCash: dbRecord.total_cash || 0,
        calculatedCash: dbRecord.calculated_cash || 0,
        tips: dbRecord.tips || 0
      },
      destinations: [],
      revenueItems: [],
      tenders: [],
      discounts: [],
      promotions: [],
      taxes: [],
      voids: dbRecord.voids || 0,
      refunds: dbRecord.refunds || 0,
      surcharges: dbRecord.surcharges || 0,
      expenses: dbRecord.expenses || 0
    };
  }

  private getEmptyKPIMetrics(): KPIMetrics {
    return {
      grossSales: 0,
      netSales: 0,
      orderCount: 0,
      averageOrderValue: 0,
      laborCostPercentage: 0,
      tips: 0,
      periodComparison: {
        grossSalesChange: 0,
        netSalesChange: 0,
        orderCountChange: 0,
        averageOrderValueChange: 0
      }
    };
  }
}

export const analyticsService = new AnalyticsService();