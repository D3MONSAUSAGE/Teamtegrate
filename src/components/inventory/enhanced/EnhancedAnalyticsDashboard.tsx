import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, TrendingUp, TrendingDown, Target, Clock, AlertTriangle,
  BarChart3, PieChart, LineChart, Users, Calendar, Download
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie
} from 'recharts';
import { EnhancedAnalyticsMetrics, EnhancedChartData } from '@/hooks/useEnhancedInventoryAnalytics';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface EnhancedAnalyticsDashboardProps {
  metrics: EnhancedAnalyticsMetrics;
  chartData: EnhancedChartData;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const EnhancedAnalyticsDashboard: React.FC<EnhancedAnalyticsDashboardProps> = ({
  metrics,
  chartData
}) => {
  const [selectedMetric, setSelectedMetric] = useState('financial');

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const FinancialTrendChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={chartData.financialTrends}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip 
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
        />
        <Line 
          type="monotone" 
          dataKey="inventoryValue" 
          stroke="#10b981" 
          strokeWidth={2}
          name="Inventory Value"
        />
        <Line 
          type="monotone" 
          dataKey="varianceCost" 
          stroke="#f59e0b" 
          strokeWidth={2}
          name="Variance Cost"
        />
        <Line 
          type="monotone" 
          dataKey="costSavings" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="Cost Savings"
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );

  const TeamComparisonChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={chartData.teamComparison}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="team" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip 
          formatter={(value: number, name: string) => {
            if (name === 'accuracy') return [formatPercentage(value), 'Accuracy'];
            if (name.includes('Cost') || name.includes('Value')) return [formatCurrency(value), name];
            return [value, name];
          }}
        />
        <Bar yAxisId="left" dataKey="accuracy" fill="#10b981" name="Accuracy (%)" />
        <Bar yAxisId="right" dataKey="varianceCost" fill="#f59e0b" name="Variance Cost" />
      </RechartsBarChart>
    </ResponsiveContainer>
  );

  const CostAnalysisPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={chartData.costAnalysis}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          dataKey="totalValue"
          label={(entry: any) => `${entry.category}: ${formatCurrency(entry.totalValue)}`}
        >
          {chartData.costAnalysis.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [formatCurrency(value), 'Total Value']} />
      </RechartsPieChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Financial Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.financial.totalInventoryValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg per item: {formatCurrency(metrics.financial.averageItemValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Total Variance Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(metrics.financial.totalVarianceCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Most expensive: {formatCurrency(metrics.financial.mostExpensiveVariance)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Cost Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics.financial.costSavings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From avoided overstock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Net Cost Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              metrics.financial.totalCostImpact >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {metrics.financial.totalCostImpact >= 0 ? '+' : ''}
              {formatCurrency(metrics.financial.totalCostImpact)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall financial impact
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section */}
      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financial Trends</TabsTrigger>
          <TabsTrigger value="teams">Team Performance</TabsTrigger>
          <TabsTrigger value="categories">Cost Analysis</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Financial Trends (14 Days)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tracking inventory value, variance costs, and savings over time
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <FinancialTrendChart />
            </CardContent>
          </Card>

          {/* Financial Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cost Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Variance Cost Ratio:</span>
                    <span className="font-medium">
                      {formatPercentage(
                        metrics.financial.totalInventoryValue > 0 ? 
                        (metrics.financial.totalVarianceCost / metrics.financial.totalInventoryValue) * 100 : 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Savings Rate:</span>
                    <span className="font-medium text-green-600">
                      {formatPercentage(
                        metrics.financial.totalVarianceCost > 0 ? 
                        (metrics.financial.costSavings / metrics.financial.totalVarianceCost) * 100 : 0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Accuracy Rate:</span>
                    <span className="font-medium">{formatPercentage(metrics.accuracyRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Completion:</span>
                    <span className="font-medium">{metrics.averageCompletionTime.toFixed(1)}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(metrics.trendDirection)}
                    <span>Performance trend: </span>
                    <Badge variant={
                      metrics.trendDirection === 'up' ? 'default' : 
                      metrics.trendDirection === 'down' ? 'destructive' : 'secondary'
                    }>
                      {metrics.trendDirection === 'up' ? 'Improving' :
                       metrics.trendDirection === 'down' ? 'Declining' : 'Stable'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly change:</span>
                    <span className={cn(
                      "font-medium",
                      metrics.monthlyComparison >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {metrics.monthlyComparison >= 0 ? '+' : ''}{formatPercentage(metrics.monthlyComparison)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">
                Accuracy rates and variance costs by team
              </p>
            </CardHeader>
            <CardContent>
              <TeamComparisonChart />
            </CardContent>
          </Card>

          {/* Team Performance Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {metrics.teamPerformance.slice(0, 6).map((team, index) => (
              <Card key={team.teamId}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {team.teamName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Accuracy</div>
                      <div className="font-bold text-lg">{formatPercentage(team.accuracy)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Time</div>
                      <div className="font-bold text-lg">{team.completionTime.toFixed(1)}h</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Value</div>
                      <div className="font-bold text-green-600">{formatCurrency(team.inventoryValue)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Variance Cost</div>
                      <div className="font-bold text-orange-600">{formatCurrency(team.varianceCost)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">{team.countCompletions} counts</span>
                    <Badge variant={
                      team.improvementTrend === 'up' ? 'default' : 
                      team.improvementTrend === 'down' ? 'destructive' : 'secondary'
                    }>
                      {team.improvementTrend === 'up' ? 'Improving' :
                       team.improvementTrend === 'down' ? 'Declining' : 'Stable'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution by Category</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Inventory value breakdown across categories
                </p>
              </CardHeader>
              <CardContent>
                <CostAnalysisPieChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chartData.costAnalysis.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-bold">{formatCurrency(category.totalValue)}</div>
                      <div className="text-muted-foreground">
                        {formatPercentage(category.accuracy)} accuracy
                      </div>
                      <div className="text-orange-600">
                        {formatCurrency(category.varianceCost)} variance cost
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Historical performance and financial metrics by month
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={chartData.monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'accuracy') return [formatPercentage(value), 'Accuracy'];
                      if (name.includes('Value') || name.includes('Cost')) return [formatCurrency(value), name];
                      return [value, name];
                    }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Accuracy"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="totalValue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Total Value"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="varianceCost" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Variance Cost"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {chartData.monthlyPerformance.slice(-4).map((month, index) => (
              <Card key={month.month}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {month.month}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-medium">{formatCurrency(month.totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className="font-medium">{formatPercentage(month.accuracy)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Teams:</span>
                    <span className="font-medium">{month.teamCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variance Cost:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(month.varianceCost)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};