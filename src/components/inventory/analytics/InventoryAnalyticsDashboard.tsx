import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/contexts/inventory';
import { useInventoryAnalytics } from '@/hooks/useInventoryAnalytics';
import { CompletionTrendChart } from './charts/CompletionTrendChart';
import { VarianceAnalysisChart } from './charts/VarianceAnalysisChart';
import { TeamPerformanceChart } from './charts/TeamPerformanceChart';
import { CategoryBreakdownChart } from './charts/CategoryBreakdownChart';
import { AlertTrendsChart } from './charts/AlertTrendsChart';
import { ExportReportDialog } from './ExportReportDialog';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Clock, 
  AlertTriangle,
  Download,
  Calendar
} from 'lucide-react';

export const InventoryAnalyticsDashboard: React.FC = () => {
  const { counts, alerts, items, transactions } = useInventory();
  const { metrics, chartData } = useInventoryAnalytics(counts, alerts, items, transactions);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Performance Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive insights into inventory management performance
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setExportDialogOpen(true)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Accuracy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{metrics.accuracyRate.toFixed(1)}%</span>
              {getTrendIcon(metrics.trendDirection)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.abs(metrics.monthlyComparison).toFixed(1)}% vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageCompletionTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average time to complete counts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Total Variances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.totalVariances}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Active Counts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {counts.filter(c => c.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">Completion Trends</TabsTrigger>
          <TabsTrigger value="variance">Variance Analysis</TabsTrigger>
          <TabsTrigger value="teams">Team Performance</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="alerts">Alert Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completion Trends (30 Days)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily inventory count completions and accuracy rates
              </p>
            </CardHeader>
            <CardContent>
              <CompletionTrendChart data={chartData.completionTrend} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variance Analysis (14 Days)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tracking discrepancies between expected and actual counts
              </p>
            </CardHeader>
            <CardContent>
              <VarianceAnalysisChart data={chartData.varianceAnalysis} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">
                Accuracy rates and completion times by team
              </p>
            </CardHeader>
            <CardContent>
              <TeamPerformanceChart data={chartData.teamPerformance} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                Inventory distribution and accuracy by category
              </p>
            </CardHeader>
            <CardContent>
              <CategoryBreakdownChart data={chartData.categoryBreakdown} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Trends (14 Days)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily breakdown of inventory alerts by type
              </p>
            </CardHeader>
            <CardContent>
              <AlertTrendsChart data={chartData.alertTrends} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExportReportDialog 
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        metrics={metrics}
        chartData={chartData}
      />
    </div>
  );
};