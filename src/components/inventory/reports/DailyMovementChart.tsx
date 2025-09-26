import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { DailyMovement } from '@/services/inventoryReportsService';

interface DailyMovementChartProps {
  data: DailyMovement[];
  selectedDate: string;
  isLoading?: boolean;
}

export const DailyMovementChart: React.FC<DailyMovementChartProps> = ({
  data,
  selectedDate,
  isLoading = false
}) => {
  const chartData = data.map(movement => ({
    type: movement.transaction_type.replace('_', ' ').toUpperCase(),
    transactions: Number(movement.transaction_count),
    quantity: Number(movement.total_quantity),
    value: Number(movement.total_value),
    pos: movement.po_numbers.filter(Boolean)
  }));

  const totalValue = data.reduce((sum, item) => sum + Number(item.total_value), 0);
  const totalTransactions = data.reduce((sum, item) => sum + Number(item.transaction_count), 0);

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
          {data.pos.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">PO Numbers:</p>
              <div className="flex flex-wrap gap-1">
                {data.pos.slice(0, 3).map((po: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {po}
                  </Badge>
                ))}
                {data.pos.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.pos.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Inventory Movements - {selectedDate}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Inventory Movements - {selectedDate}</CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total Value: {formatCurrency(totalValue)}</span>
          <span>Total Transactions: {formatNumber(totalTransactions)}</span>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No movements recorded for {selectedDate}
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="type" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name="Value ($)"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* PO Summary */}
        {data.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Purchase Orders Referenced:</h4>
            <div className="flex flex-wrap gap-2">
              {data
                .flatMap(movement => movement.po_numbers)
                .filter(Boolean)
                .slice(0, 10)
                .map((po, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {po}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};