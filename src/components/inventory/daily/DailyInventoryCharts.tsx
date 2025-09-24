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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.teamPerformance.length > 0 ? (
            <div className="space-y-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="team" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'accuracy' ? formatPercentage(value as number) : value,
                        name === 'accuracy' ? 'Accuracy' : 'Counts'
                      ]}
                    />
                    <Bar dataKey="counts" fill="hsl(var(--primary))" name="counts" />
                    <Bar dataKey="accuracy" fill="hsl(var(--chart-2))" name="accuracy" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {chartData.teamPerformance.map((team, index) => (
                    <div key={team.team} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <div className="font-medium">{team.team}</div>
                        <div className="text-sm text-muted-foreground">
                          {team.totalItems} items counted
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{team.counts} counts</div>
                        <Badge variant={team.accuracy >= 95 ? 'default' : team.accuracy >= 85 ? 'secondary' : 'destructive'}>
                          {formatPercentage(team.accuracy)} accuracy
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No team activity today</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variance Breakdown */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Top Variances Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.varianceBreakdown.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {chartData.varianceBreakdown.map((variance, index) => (
                  <div key={`${variance.item}-${index}`} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{variance.item}</span>
                        {variance.variance > 0 ? (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-success" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Expected: {variance.expected} | Actual: {variance.actual}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-destructive">
                        {variance.variance > 0 ? '+' : ''}{variance.variance.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(variance.cost)} impact
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No variances detected today</p>
                <p className="text-sm">Great job on accuracy!</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};