import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { DailyMovement } from '@/services/inventoryReportsService';
import { format } from 'date-fns';

interface TransactionRecordsChartProps {
  data: DailyMovement[];
  selectedDate: string;
  isLoading?: boolean;
}

export const TransactionRecordsChart: React.FC<TransactionRecordsChartProps> = ({
  data,
  selectedDate,
  isLoading = false
}) => {
  // Aggregate the transaction records for the chart
  const aggregatedData = React.useMemo(() => {
    const aggregation = data.reduce((acc, transaction) => {
      const type = transaction.transaction_type;
      if (!acc[type]) {
        acc[type] = {
          type: type.replace('_', ' ').toUpperCase(),
          transactions: 0,
          quantity: 0,
          value: 0
        };
      }
      
      acc[type].transactions += transaction.transaction_count;
      acc[type].quantity += transaction.total_quantity;
      acc[type].value += transaction.total_value;
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(aggregation);
  }, [data]);

  const totalValue = data.reduce((sum, item) => sum + Number(item.total_value), 0);
  const totalTransactions = data.reduce((sum, item) => sum + item.transaction_count, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-primary">
            Value: {formatCurrency(data.value)}
          </p>
          <p className="text-muted-foreground">
            Transactions: {data.transactions}
          </p>
          <p className="text-muted-foreground">
            Quantity: {formatNumber(data.quantity)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Daily Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Daily Transactions - {format(new Date(selectedDate), 'MMM dd, yyyy')}
        </CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total: {formatCurrency(totalValue)}</span>
          <span>Transactions: {totalTransactions}</span>
        </div>
      </CardHeader>
      <CardContent>
        {aggregatedData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            No transaction data available for this date
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aggregatedData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="type" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                className="drop-shadow-sm"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {/* Transaction Summary */}
        {data.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-sm">Transaction Summary</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {data.map((movement, index) => (
                <div key={movement.transaction_type} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded">
                  <div>
                    <span className="font-medium">{movement.transaction_type.replace('_', ' ').toUpperCase()}</span>
                    <span className="ml-2 text-muted-foreground">
                      {formatNumber(movement.total_quantity)} items
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(movement.total_value)}</div>
                    <div className="text-xs text-muted-foreground">{movement.transaction_count} transactions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};