import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, DollarSign, TrendingUp, AlertTriangle, Box, Truck } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { InventoryValueSummary } from '@/services/inventoryReportsService';

interface InventoryMetricsCardsProps {
  summaryData: InventoryValueSummary[];
  isLoading?: boolean;
}

export const InventoryMetricsCards: React.FC<InventoryMetricsCardsProps> = ({
  summaryData,
  isLoading = false
}) => {
  const totalValue = summaryData.reduce((sum, team) => sum + Number(team.total_value), 0);
  const totalItems = summaryData.reduce((sum, team) => sum + Number(team.total_items), 0);
  const totalLowStock = summaryData.reduce((sum, team) => sum + Number(team.low_stock_count), 0);
  const totalOverstock = summaryData.reduce((sum, team) => sum + Number(team.overstock_count), 0);
  const activeTeams = summaryData.length;

  const metrics = [
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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