import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { PayrollComparison } from '@/types/payroll';

interface PayrollComparisonMetricsProps {
  comparison: PayrollComparison | null;
}

export const PayrollComparisonMetrics: React.FC<PayrollComparisonMetricsProps> = ({ comparison }) => {
  if (!comparison) {
    return null;
  }

  const formatChange = (value: number, isPercentage: boolean = false) => {
    const abs = Math.abs(value);
    const formatted = isPercentage 
      ? `${abs.toFixed(1)}%`
      : `${abs.toFixed(1)}%`;
    return { formatted, isPositive: value >= 0 };
  };

  const metrics = [
    { label: 'Payroll Cost', change: comparison.laborCostChange },
    { label: 'Hours Worked', change: comparison.hoursChange },
    { label: 'Sales', change: comparison.salesChange },
    { label: 'Labor %', change: comparison.laborPercentageChange, isPercentage: true, inverse: true },
    { label: 'Sales/Hour', change: comparison.salesPerHourChange },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Week-over-Week Changes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics.map((metric) => {
            const { formatted, isPositive } = formatChange(metric.change, metric.isPercentage);
            const showPositive = metric.inverse ? !isPositive : isPositive;
            const colorClass = showPositive ? 'text-success' : 'text-destructive';
            const Icon = isPositive ? ArrowUp : ArrowDown;

            return (
              <div key={metric.label} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{metric.label}</span>
                <div className={`flex items-center gap-1 ${colorClass}`}>
                  <Icon className="h-3 w-3" />
                  <span className="text-sm font-medium">{formatted}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
