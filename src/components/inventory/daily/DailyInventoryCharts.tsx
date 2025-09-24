import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DailyChartData } from '@/hooks/useDailyInventoryAnalytics';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { Package, AlertTriangle, Users, TrendingUp, TrendingDown } from 'lucide-react';

interface DailyInventoryChartsProps {
  chartData: DailyChartData;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const DailyInventoryCharts: React.FC<DailyInventoryChartsProps> = ({ chartData }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Items by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.itemBreakdown.length > 0 ? (
            <div className="space-y-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.itemBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="hsl(var(--primary))"
                      dataKey="count"
                      label={({ category, count }: any) => `${category}: ${count}`}
                    >
                      {chartData.itemBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, 'Items']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {chartData.itemBreakdown.map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{item.count} items</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(item.value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No items counted today</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};