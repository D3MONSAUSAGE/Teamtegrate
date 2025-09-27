import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, ShoppingCart, Percent } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface SalesMetrics {
  totalSalesRevenue: number;
  totalSalesTransactions: number;
  totalProfit: number;
  profitMargin: number;
}

interface SalesMetricsCardsProps {
  salesMetrics: SalesMetrics;
  isLoading?: boolean;
}

export const SalesMetricsCards: React.FC<SalesMetricsCardsProps> = ({
  salesMetrics,
  isLoading = false
}) => {
  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(salesMetrics.totalSalesRevenue),
      icon: DollarSign,
      color: "bg-green-500/10 text-green-600",
      description: "Sales revenue"
    },
    {
      title: "Net Profit",
      value: formatCurrency(salesMetrics.totalProfit),
      icon: TrendingUp,
      color: salesMetrics.totalProfit >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600",
      description: "Total profit"
    },
    {
      title: "Transactions",
      value: formatNumber(salesMetrics.totalSalesTransactions),
      icon: ShoppingCart,
      color: "bg-blue-500/10 text-blue-600",
      description: "Sales orders"
    },
    {
      title: "Profit Margin",
      value: `${salesMetrics.profitMargin.toFixed(1)}%`,
      icon: Percent,
      color: salesMetrics.profitMargin >= 20 ? "bg-green-500/10 text-green-600" : 
             salesMetrics.profitMargin >= 10 ? "bg-orange-500/10 text-orange-600" : 
             "bg-red-500/10 text-red-600",
      description: "Avg. margin"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <div className={`h-4 w-4 rounded-full flex items-center justify-center ${metric.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};