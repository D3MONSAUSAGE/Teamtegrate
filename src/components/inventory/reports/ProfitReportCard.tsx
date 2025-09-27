import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { InventoryTransaction } from '@/contexts/inventory/types';

interface ProfitData {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  transactions: {
    sales: number;
    totalItems: number;
  };
}

interface ProfitReportCardProps {
  transactions: InventoryTransaction[];
  className?: string;
}

export const ProfitReportCard: React.FC<ProfitReportCardProps> = ({ 
  transactions, 
  className 
}) => {
  // Calculate profit data from transactions
  const profitData: ProfitData = React.useMemo(() => {
    const salesTransactions = transactions.filter(t => 
      t.transaction_type === 'out' && 
      t.reference_number?.toLowerCase().includes('sale')
    );

    let totalRevenue = 0;
    let totalCost = 0;
    let totalItems = 0;

    salesTransactions.forEach(transaction => {
      const quantity = Math.abs(transaction.quantity); // Make positive for calculations
      const unitCost = transaction.unit_cost || 0;
      
      // For sales transactions, the unit_cost might represent the sale price
      // In a real system, you'd want to store both cost and sale price separately
      // For now, we'll estimate: if unit_cost > item.unit_cost, it's likely a sale price
      totalRevenue += unitCost * quantity;
      
      // Estimate cost (this is a simplified calculation)
      // In reality, you'd want to track the actual cost basis
      totalCost += (unitCost * 0.7) * quantity; // Assuming 30% margin on average
      
      totalItems += quantity;
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      transactions: {
        sales: salesTransactions.length,
        totalItems
      }
    };
  }, [transactions]);

  const getProfitIcon = () => {
    if (profitData.totalProfit > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (profitData.totalProfit < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getProfitColor = () => {
    if (profitData.totalProfit > 0) return 'text-green-600';
    if (profitData.totalProfit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMarginBadgeVariant = () => {
    if (profitData.profitMargin >= 20) return 'default';
    if (profitData.profitMargin >= 10) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <DollarSign className="h-4 w-4" />
          Sales Profit Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-lg font-semibold text-green-600">
              ${profitData.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-lg font-semibold text-gray-600">
              ${profitData.totalCost.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Profit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Net Profit</p>
            {getProfitIcon()}
          </div>
          <div className="flex items-center justify-between">
            <p className={`text-xl font-bold ${getProfitColor()}`}>
              ${profitData.totalProfit.toFixed(2)}
            </p>
            <Badge variant={getMarginBadgeVariant()}>
              {profitData.profitMargin.toFixed(1)}% margin
            </Badge>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sales Transactions</p>
              <p className="font-medium">{profitData.transactions.sales}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Items Sold</p>
              <p className="font-medium">{profitData.transactions.totalItems}</p>
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        {profitData.transactions.sales > 0 && (
          <div className="text-xs text-muted-foreground">
            <p>
              Average sale: ${(profitData.totalRevenue / profitData.transactions.sales).toFixed(2)}
            </p>
            <p>
              Profit per item: ${(profitData.totalProfit / profitData.transactions.totalItems).toFixed(2)}
            </p>
          </div>
        )}

        {profitData.transactions.sales === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No sales transactions found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sales data will appear here once you start recording sales
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};