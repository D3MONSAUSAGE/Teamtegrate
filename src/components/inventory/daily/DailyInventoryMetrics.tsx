import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  TrendingUp,
  DollarSign,
  Percent,
  Receipt,
  ShoppingCart,
  ArrowUpDown
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { DailyFinancialMetrics } from '@/hooks/useDailyFinancialAnalytics';

interface DailyInventoryMetricsProps {
  summary: DailyFinancialMetrics;
  timezone?: string;
}

export const DailyInventoryMetrics: React.FC<DailyInventoryMetricsProps> = ({ summary }) => {
  // Determine profit color
  const getProfitColor = (value: number) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  // Determine margin color
  const getMarginColor = (rate: number) => {
    if (rate >= 30) return 'text-success';
    if (rate >= 15) return 'text-warning';
    return 'text-destructive';
  };

  // Determine trend color
  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue),
      icon: DollarSign,
      description: `${summary.totalTransactions} transactions`,
      color: 'text-primary'
    },
    {
      title: 'Gross Profit',
      value: formatCurrency(summary.grossProfit),
      icon: TrendingUp,
      description: `${summary.profitMargin.toFixed(1)}% margin`,
      color: getProfitColor(summary.grossProfit)
    },
    {
      title: 'Total COGS',
      value: formatCurrency(summary.totalCOGS),
      icon: Package,
      description: 'Cost of sales',
      color: 'text-blue-500'
    },
    {
      title: 'Profit Margin',
      value: `${summary.profitMargin.toFixed(1)}%`,
      icon: Percent,
      description: 'Gross margin',
      color: getMarginColor(summary.profitMargin)
    },
    {
      title: 'Average Ticket',
      value: formatCurrency(summary.averageTicket),
      icon: Receipt,
      description: 'Per transaction',
      color: 'text-purple-500'
    },
    {
      title: 'Transactions',
      value: formatNumber(summary.totalTransactions),
      icon: ShoppingCart,
      description: 'Sales count',
      color: 'text-success'
    },
    {
      title: 'Net Change',
      value: formatCurrency(summary.netChange),
      icon: ArrowUpDown,
      description: `In: ${formatCurrency(summary.totalIncoming)} | Out: ${formatCurrency(summary.totalOutgoing)}`,
      color: 'text-indigo-500'
    },
    {
      title: 'vs Yesterday',
      value: `${summary.vsYesterday.revenue > 0 ? '↑' : '↓'} ${Math.abs(summary.vsYesterday.revenue).toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Revenue change',
      color: getTrendColor(summary.vsYesterday.revenue)
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Daily Financial Summary</h3>
          <p className="text-sm text-muted-foreground">
            Revenue, profit, and sales performance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", metric.color)}>
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metric.description}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
