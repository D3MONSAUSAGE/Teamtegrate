import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, DollarSign, TrendingUp, AlertTriangle, Box, Truck } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { InventoryValueSummary } from '@/services/inventoryReportsService';

interface InventoryMetricsCardsProps {
  summaryData: InventoryValueSummary[];
  salesMetrics?: SalesMetrics;
  isLoading?: boolean;
}

interface SalesMetrics {
  totalSalesRevenue: number;
  totalSalesTransactions: number;
  totalProfit: number;
  profitMargin: number;
}

export const InventoryMetricsCards: React.FC<InventoryMetricsCardsProps> = ({
  summaryData,
  salesMetrics,
  isLoading = false
}) => {
  const totalValue = summaryData.reduce((sum, team) => sum + Number(team.total_value), 0);
  const totalItems = summaryData.reduce((sum, team) => sum + Number(team.total_items), 0);
  const totalLowStock = summaryData.reduce((sum, team) => sum + Number(team.low_stock_count), 0);
  const totalOverstock = summaryData.reduce((sum, team) => sum + Number(team.overstock_count), 0);
  const activeTeams = summaryData.length;

  const baseMetrics = [
    {
      title: "Total Inventory Value",
      value: formatCurrency(totalValue),
      icon: DollarSign,
      color: "bg-primary/10 text-primary",
      description: "Across all teams"
    },
    {
      title: "Total Items",
      value: formatNumber(totalItems),
      icon: Package,
      color: "bg-blue-500/10 text-blue-600",
      description: `${activeTeams} active teams`
    },
    {
      title: "Low Stock Alerts",
      value: formatNumber(totalLowStock),
      icon: AlertTriangle,
      color: totalLowStock > 0 ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600",
      description: "Items below threshold"
    },
    {
      title: "Overstock Items",
      value: formatNumber(totalOverstock),
      icon: Box,
      color: totalOverstock > 0 ? "bg-orange-500/10 text-orange-600" : "bg-green-500/10 text-green-600",
      description: "Items above threshold"
    }
  ];

  const salesMetricsCards = salesMetrics ? [
    {
      title: "Sales Revenue",
      value: formatCurrency(salesMetrics.totalSalesRevenue),
      icon: TrendingUp,
      color: "bg-green-500/10 text-green-600",
      description: `${salesMetrics.totalSalesTransactions} transactions`
    },
    {
      title: "Net Profit",
      value: formatCurrency(salesMetrics.totalProfit),
      icon: DollarSign,
      color: salesMetrics.totalProfit >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600",
      description: `${salesMetrics.profitMargin.toFixed(1)}% margin`
    }
  ] : [];

  const metrics = [...baseMetrics, ...salesMetricsCards];

  if (isLoading) {
    const loadingCount = salesMetrics ? 6 : 4;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {Array.from({ length: loadingCount }, (_, i) => i + 1).map((i) => (
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
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