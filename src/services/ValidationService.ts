import { SalesData } from '@/types/sales';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isWeekend, differenceInDays } from 'date-fns';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  suggestedFix?: string;
  category: 'business_rule' | 'data_integrity' | 'anomaly' | 'compliance';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  confidenceScore: number; // 0-100
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  anomaliesDetected: AnomalyDetection[];
}

export interface AnomalyDetection {
  type: 'sales_spike' | 'sales_drop' | 'unusual_orders' | 'labor_anomaly' | 'payment_anomaly';
  severity: 'low' | 'medium' | 'high';
  description: string;
  value: number;
  expectedRange: { min: number; max: number };
  likelihood: number; // 0-1
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: ValidationError['category'];
  severity: ValidationError['severity'];
  validate: (data: SalesData, context: ValidationContext) => ValidationError | null;
}

export interface ValidationContext {
  historicalData: SalesData[];
  teamAverages: Record<string, number>;
  seasonalPatterns: Record<string, number>;
  businessRules: BusinessRules;
}

export interface BusinessRules {
  maxDailySales: number;
  minDailySales: number;
  maxLaborPercentage: number;
  maxOrderCount: number;
  expectedAverageOrder: { min: number; max: number };
  cashReconciliationTolerance: number;
}

class ValidationService {
  private readonly businessRules: BusinessRules = {
    maxDailySales: 50000,
    minDailySales: 100,
    maxLaborPercentage: 40,
    maxOrderCount: 1000,
    expectedAverageOrder: { min: 5, max: 150 },
    cashReconciliationTolerance: 10
  };

  private readonly validationRules: ValidationRule[] = [
    {
      id: 'gross_sales_positive',
      name: 'Gross Sales Validation',
      description: 'Gross sales must be positive',
      category: 'data_integrity',
      severity: 'error',
      validate: (data) => {
        if (!data.grossSales || data.grossSales <= 0) {
          return {
            field: 'grossSales',
            message: 'Gross sales must be greater than zero',
            severity: 'error',
            category: 'data_integrity',
            suggestedFix: 'Verify POS data extraction - gross sales cannot be zero or negative'
          };
        }
        return null;
      }
    },
    {
      id: 'net_vs_gross_sales',
      name: 'Net vs Gross Sales Relationship',
      description: 'Net sales should be less than or equal to gross sales',
      category: 'business_rule',
      severity: 'error',
      validate: (data) => {
        if (data.netSales > data.grossSales) {
          return {
            field: 'netSales',
            message: 'Net sales cannot exceed gross sales',
            severity: 'error',
            category: 'business_rule',
            suggestedFix: 'Check discount and tax calculations'
          };
        }
        return null;
      }
    },
    {
      id: 'order_count_reasonable',
      name: 'Order Count Validation',
      description: 'Order count should be within reasonable limits',
      category: 'anomaly',
      severity: 'warning',
      validate: (data, context) => {
        if (data.orderCount > context.businessRules.maxOrderCount) {
          return {
            field: 'orderCount',
            message: `Order count (${data.orderCount}) exceeds maximum expected (${context.businessRules.maxOrderCount})`,
            severity: 'warning',
            category: 'anomaly',
            suggestedFix: 'Verify this is not a system error or special event day'
          };
        }
        return null;
      }
    },
    {
      id: 'average_order_value',
      name: 'Average Order Value Check',
      description: 'Average order value should be within expected range',
      category: 'business_rule',
      severity: 'warning',
      validate: (data, context) => {
        const aov = data.orderCount > 0 ? data.netSales / data.orderCount : 0;
        const { min, max } = context.businessRules.expectedAverageOrder;
        
        if (aov < min || aov > max) {
          return {
            field: 'orderAverage',
            message: `Average order value ($${aov.toFixed(2)}) is outside expected range ($${min}-$${max})`,
            severity: 'warning',
            category: 'business_rule',
            suggestedFix: aov < min ? 'Check for missing items or pricing issues' : 'Verify high-value transactions'
          };
        }
        return null;
      }
    },
    {
      id: 'labor_percentage',
      name: 'Labor Cost Percentage',
      description: 'Labor cost should be within acceptable percentage of sales',
      category: 'business_rule',
      severity: 'warning',
      validate: (data, context) => {
        if (!data.labor?.cost || !data.grossSales) return null;
        
        const laborPercentage = (data.labor.cost / data.grossSales) * 100;
        if (laborPercentage > context.businessRules.maxLaborPercentage) {
          return {
            field: 'labor',
            message: `Labor cost (${laborPercentage.toFixed(1)}%) exceeds maximum threshold (${context.businessRules.maxLaborPercentage}%)`,
            severity: 'warning',
            category: 'business_rule',
            suggestedFix: 'Review staffing levels and productivity'
          };
        }
        return null;
      }
    },
    {
      id: 'cash_reconciliation',
      name: 'Cash Reconciliation Check',
      description: 'Cash amounts should reconcile properly',
      category: 'compliance',
      severity: 'error',
      validate: (data, context) => {
        if (!data.paymentBreakdown) return null;
        
        const { totalCash, calculatedCash } = data.paymentBreakdown;
        const difference = Math.abs(totalCash - calculatedCash);
        
        if (difference > context.businessRules.cashReconciliationTolerance) {
          return {
            field: 'paymentBreakdown',
            message: `Cash reconciliation difference ($${difference.toFixed(2)}) exceeds tolerance ($${context.businessRules.cashReconciliationTolerance})`,
            severity: 'error',
            category: 'compliance',
            suggestedFix: 'Verify cash counts and payment processing'
          };
        }
        return null;
      }
    },
    {
      id: 'required_fields',
      name: 'Required Fields Check',
      description: 'All required fields must be present',
      category: 'data_integrity',
      severity: 'error',
      validate: (data) => {
        const requiredFields = ['date', 'location', 'grossSales', 'netSales', 'orderCount'];
        const missingFields = requiredFields.filter(field => 
          !data[field as keyof SalesData] && data[field as keyof SalesData] !== 0
        );
        
        if (missingFields.length > 0) {
          return {
            field: missingFields[0],
            message: `Required field '${missingFields[0]}' is missing`,
            severity: 'error',
            category: 'data_integrity',
            suggestedFix: 'Ensure POS system exports all required data fields'
          };
        }
        return null;
      }
    }
  ];

  async validateSalesData(data: SalesData, teamId?: string): Promise<ValidationResult> {
    try {
      // Get validation context
      const context = await this.buildValidationContext(data, teamId);
      
      // Run all validation rules
      const allIssues: ValidationError[] = [];
      
      for (const rule of this.validationRules) {
        const result = rule.validate(data, context);
        if (result) {
          allIssues.push(result);
        }
      }
      
      // Detect anomalies
      const anomalies = await this.detectAnomalies(data, context);
      
      // Categorize issues
      const errors = allIssues.filter(issue => issue.severity === 'error' || issue.severity === 'critical');
      const warnings = allIssues.filter(issue => issue.severity === 'warning' || issue.severity === 'info');
      
      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(data, allIssues, anomalies);
      
      // Determine data quality
      const dataQuality = this.determineDataQuality(confidenceScore, errors.length, warnings.length);
      
      // Log validation results for audit trail
      await this.logValidationResults(data, {
        isValid: errors.length === 0,
        errors,
        warnings,
        confidenceScore,
        dataQuality,
        anomaliesDetected: anomalies
      });
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        confidenceScore,
        dataQuality,
        anomaliesDetected: anomalies
      };
    } catch (error) {
      console.error('[ValidationService] Error validating sales data:', error);
      return {
        isValid: false,
        errors: [{
          field: 'system',
          message: 'Validation system error occurred',
          severity: 'critical',
          category: 'data_integrity'
        }],
        warnings: [],
        confidenceScore: 0,
        dataQuality: 'poor',
        anomaliesDetected: []
      };
    }
  }

  async detectAnomalies(data: SalesData, context: ValidationContext): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];
    
    try {
      // Sales spike/drop detection
      if (context.historicalData.length >= 7) {
        const avgSales = context.historicalData.reduce((sum, d) => sum + d.grossSales, 0) / context.historicalData.length;
        const stdDev = Math.sqrt(
          context.historicalData.reduce((sum, d) => sum + Math.pow(d.grossSales - avgSales, 2), 0) / context.historicalData.length
        );
        
        const zScore = Math.abs((data.grossSales - avgSales) / stdDev);
        
        if (zScore > 2) { // 2 standard deviations
          anomalies.push({
            type: data.grossSales > avgSales ? 'sales_spike' : 'sales_drop',
            severity: zScore > 3 ? 'high' : 'medium',
            description: `Sales ${data.grossSales > avgSales ? 'spike' : 'drop'} detected - ${Math.abs(((data.grossSales - avgSales) / avgSales) * 100).toFixed(1)}% ${data.grossSales > avgSales ? 'above' : 'below'} average`,
            value: data.grossSales,
            expectedRange: { min: avgSales - 2 * stdDev, max: avgSales + 2 * stdDev },
            likelihood: Math.min(0.95, zScore / 4)
          });
        }
      }
      
      // Labor anomaly detection
      if (data.labor?.cost && data.grossSales) {
        const laborPercentage = (data.labor.cost / data.grossSales) * 100;
        const expectedLaborRange = { min: 20, max: 35 }; // Industry standard
        
        if (laborPercentage < expectedLaborRange.min || laborPercentage > expectedLaborRange.max) {
          anomalies.push({
            type: 'labor_anomaly',
            severity: laborPercentage > 40 ? 'high' : 'medium',
            description: `Labor cost percentage (${laborPercentage.toFixed(1)}%) is ${laborPercentage > expectedLaborRange.max ? 'above' : 'below'} expected range`,
            value: laborPercentage,
            expectedRange: expectedLaborRange,
            likelihood: 0.8
          });
        }
      }
      
      // Payment anomaly detection
      if (data.paymentBreakdown) {
        const totalPayments = data.paymentBreakdown.nonCash + data.paymentBreakdown.totalCash;
        const salesDiscrepancy = Math.abs(totalPayments - data.grossSales);
        const tolerance = data.grossSales * 0.02; // 2% tolerance
        
        if (salesDiscrepancy > tolerance) {
          anomalies.push({
            type: 'payment_anomaly',
            severity: salesDiscrepancy > (data.grossSales * 0.05) ? 'high' : 'medium',
            description: `Payment total ($${totalPayments.toFixed(2)}) doesn't match gross sales ($${data.grossSales.toFixed(2)})`,
            value: salesDiscrepancy,
            expectedRange: { min: -tolerance, max: tolerance },
            likelihood: 0.9
          });
        }
      }
      
    } catch (error) {
      console.error('[ValidationService] Error detecting anomalies:', error);
    }
    
    return anomalies;
  }

  private async buildValidationContext(data: SalesData, teamId?: string): Promise<ValidationContext> {
    try {
      // Get historical data for the same team (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let query = supabase
        .from('sales_data')
        .select('*')
        .gte('date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .lt('date', data.date);
      
      if (teamId) {
        query = query.eq('team_id', teamId);
      }
      
      const { data: historicalData } = await query;
      
      // Calculate team averages
      const teamAverages = this.calculateTeamAverages(historicalData || []);
      
      return {
        historicalData: historicalData || [],
        teamAverages,
        seasonalPatterns: {}, // Would implement seasonal analysis here
        businessRules: this.businessRules
      };
    } catch (error) {
      console.error('[ValidationService] Error building validation context:', error);
      return {
        historicalData: [],
        teamAverages: {},
        seasonalPatterns: {},
        businessRules: this.businessRules
      };
    }
  }

  private calculateConfidenceScore(data: SalesData, issues: ValidationError[], anomalies: AnomalyDetection[]): number {
    let score = 100;
    
    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'error':
          score -= 15;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 2;
          break;
      }
    });
    
    // Deduct points for anomalies
    anomalies.forEach(anomaly => {
      switch (anomaly.severity) {
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });
    
    // Boost score for complete data
    if (data.destinations && data.destinations.length > 0) score += 5;
    if (data.revenueItems && data.revenueItems.length > 0) score += 5;
    if (data.labor) score += 5;
    if (data.paymentBreakdown) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private determineDataQuality(confidenceScore: number, errorCount: number, warningCount: number): ValidationResult['dataQuality'] {
    if (errorCount > 0) return 'poor';
    if (confidenceScore >= 90 && warningCount <= 1) return 'excellent';
    if (confidenceScore >= 75 && warningCount <= 3) return 'good';
    if (confidenceScore >= 60) return 'fair';
    return 'poor';
  }

  private calculateTeamAverages(historicalData: SalesData[]): Record<string, number> {
    if (historicalData.length === 0) return {};
    
    const totals = historicalData.reduce((acc, sale) => ({
      grossSales: acc.grossSales + sale.grossSales,
      netSales: acc.netSales + sale.netSales,
      orderCount: acc.orderCount + sale.orderCount
    }), { grossSales: 0, netSales: 0, orderCount: 0 });
    
    const count = historicalData.length;
    return {
      avgGrossSales: totals.grossSales / count,
      avgNetSales: totals.netSales / count,
      avgOrderCount: totals.orderCount / count,
      avgOrderValue: totals.orderCount > 0 ? totals.netSales / totals.orderCount : 0
    };
  }

  private async logValidationResults(data: SalesData, result: ValidationResult): Promise<void> {
    try {
      // Log significant validation issues
      const significantIssues = [
        ...result.errors,
        ...result.warnings.filter(w => w.severity === 'warning')
      ];
      
      for (const issue of significantIssues) {
        await supabase.from('data_validation_log').insert({
          sales_data_id: data.id,
          validation_type: issue.category,
          field_name: issue.field,
          severity: issue.severity,
          message: issue.message,
          expected_value: issue.suggestedFix || null,
          actual_value: String(data[issue.field as keyof SalesData] || ''),
          is_resolved: false
        });
      }
    } catch (error) {
      console.error('[ValidationService] Error logging validation results:', error);
    }
  }

  async getValidationHistory(salesDataId: string): Promise<ValidationError[]> {
    try {
      const { data, error } = await supabase
        .from('data_validation_log')
        .select('*')
        .eq('sales_data_id', salesDataId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(log => ({
        field: log.field_name,
        message: log.message,
        severity: log.severity as ValidationError['severity'],
        category: log.validation_type as ValidationError['category'],
        suggestedFix: log.expected_value
      }));
    } catch (error) {
      console.error('[ValidationService] Error getting validation history:', error);
      return [];
    }
  }
}

export const validationService = new ValidationService();