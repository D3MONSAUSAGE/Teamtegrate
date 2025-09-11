import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Info, TrendingUp, DollarSign, Users, Target, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedTooltipProps {
  title: string;
  description: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  type?: 'info' | 'help' | 'warning' | 'success';
  showIcon?: boolean;
  className?: string;
}

const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  title,
  description,
  children,
  side = 'top',
  type = 'info',
  showIcon = true,
  className
}) => {
  const getIcon = () => {
    switch (type) {
      case 'help':
        return <HelpCircle className="h-3 w-3 text-muted-foreground" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'info':
      default:
        return <Info className="h-3 w-3 text-blue-500" />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("cursor-help", className)}>
            {children}
            {showIcon && (
              <span className="ml-1 inline-block">
                {getIcon()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Pre-configured tooltips for common finance terms
export const FinanceTooltips = {
  GrossSales: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Gross Sales"
      description="Total revenue before any deductions including taxes, discounts, or refunds. This represents the raw sales volume."
      type="info"
    >
      {children}
    </EnhancedTooltip>
  ),

  NetSales: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Net Sales"
      description="Revenue after deducting taxes, discounts, refunds, and other adjustments. This is your actual earnings."
      type="success"
    >
      {children}
    </EnhancedTooltip>
  ),

  LaborCost: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Labor Cost"
      description="Total cost of employee wages, benefits, and payroll taxes. Industry benchmark is typically 25-35% of revenue."
      type="warning"
    >
      {children}
    </EnhancedTooltip>
  ),

  LaborPercentage: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Labor Percentage"
      description="Labor costs as a percentage of revenue. Green: <25%, Yellow: 25-35%, Red: >35%. Lower is generally better."
      type="help"
    >
      {children}
    </EnhancedTooltip>
  ),

  AverageOrderValue: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Average Order Value (AOV)"
      description="Total revenue divided by number of orders. Higher AOV indicates customers are purchasing more per visit."
      type="info"
    >
      {children}
    </EnhancedTooltip>
  ),

  SalesPerLaborHour: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Sales per Labor Hour"
      description="Revenue generated per hour of labor. Higher values indicate better efficiency and productivity."
      type="success"
    >
      {children}
    </EnhancedTooltip>
  ),

  GrossProfitMargin: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Gross Profit Margin"
      description="Percentage of revenue remaining after cost of goods sold. Indicates pricing strategy effectiveness and operational efficiency."
      type="info"
    >
      {children}
    </EnhancedTooltip>
  ),

  CashManagement: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Cash Management"
      description="Tracks cash deposits, redemptions, paid-ins, and paid-outs. Helps identify cash flow patterns and potential discrepancies."
      type="help"
    >
      {children}
    </EnhancedTooltip>
  ),

  GiftCardActivity: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Gift Card Activity"
      description="Tracks gift card sales and redemptions. High issuance indicates customer loyalty; high redemption shows active usage."
      type="info"
    >
      {children}
    </EnhancedTooltip>
  ),

  TaxCalculation: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Tax Calculation"
      description="Automated tax computation based on location and applicable rates. Includes sales tax, VAT, or other local taxes."
      type="warning"
    >
      {children}
    </EnhancedTooltip>
  ),

  ValidationConfidence: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Validation Confidence"
      description="AI-powered confidence score for data accuracy. Green: >90%, Yellow: 70-90%, Red: <70%. Low scores may need review."
      type="help"
    >
      {children}
    </EnhancedTooltip>
  ),

  BatchProcessing: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Batch Processing"
      description="Simultaneous processing of multiple files. Improves efficiency and reduces manual work. Progress tracked in real-time."
      type="success"
    >
      {children}
    </EnhancedTooltip>
  ),

  AnomalyDetection: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Anomaly Detection"
      description="Automated detection of unusual patterns in your data. Helps identify errors, fraud, or operational issues early."
      type="warning"
    >
      {children}
    </EnhancedTooltip>
  ),

  ForecastAccuracy: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Forecast Accuracy"
      description="Precision of predictive models based on historical data. Higher accuracy enables better planning and decision-making."
      type="info"
    >
      {children}
    </EnhancedTooltip>
  ),

  ComplianceCheck: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Compliance Check"
      description="Automated verification against regulatory requirements and internal policies. Ensures data integrity and legal compliance."
      type="help"
    >
      {children}
    </EnhancedTooltip>
  ),

  PerformanceInsight: ({ children }: { children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Performance Insight"
      description="AI-generated recommendations based on data patterns. Provides actionable advice to improve operations and profitability."
      type="success"
    >
      {children}
    </EnhancedTooltip>
  )
};

// Metric explanation tooltips
export const MetricTooltips = {
  RevenueGrowth: ({ value, children }: { value: number; children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Revenue Growth"
      description={`${value >= 0 ? 'Positive' : 'Negative'} revenue change compared to previous period. ${
        value >= 10 ? 'Excellent growth!' : 
        value >= 5 ? 'Good growth.' : 
        value >= 0 ? 'Slight growth.' : 
        value >= -5 ? 'Slight decline.' : 'Significant decline - needs attention.'
      }`}
      type={value >= 0 ? 'success' : 'warning'}
    >
      {children}
    </EnhancedTooltip>
  ),

  EfficiencyRating: ({ rating, children }: { rating: number; children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Efficiency Rating"
      description={`Performance score based on sales per labor hour. ${
        rating >= 80 ? 'Excellent efficiency!' : 
        rating >= 60 ? 'Good efficiency.' : 
        rating >= 40 ? 'Average efficiency - room for improvement.' : 'Low efficiency - optimization needed.'
      }`}
      type={rating >= 60 ? 'success' : rating >= 40 ? 'info' : 'warning'}
    >
      {children}
    </EnhancedTooltip>
  ),

  CostControl: ({ percentage, children }: { percentage: number; children: React.ReactNode }) => (
    <EnhancedTooltip
      title="Cost Control"
      description={`Labor cost as percentage of revenue. ${
        percentage <= 25 ? 'Excellent cost control!' : 
        percentage <= 35 ? 'Good cost management.' : 'High costs - optimization recommended.'
      } Industry benchmark: 25-35%`}
      type={percentage <= 35 ? 'success' : 'warning'}
    >
      {children}
    </EnhancedTooltip>
  )
};

export default EnhancedTooltip;