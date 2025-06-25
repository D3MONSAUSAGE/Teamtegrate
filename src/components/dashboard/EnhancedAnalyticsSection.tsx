
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTask } from '@/contexts/task';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import CompletionTrendChart from './analytics/CompletionTrendChart';
import TaskDistributionChart from './analytics/TaskDistributionChart';
import ProductivityHeatmap from './analytics/ProductivityHeatmap';
import VelocityChart from './analytics/VelocityChart';
import AnalyticsInsightsPanel from './analytics/AnalyticsInsightsPanel';
import { BarChart3, RefreshCw, Download } from 'lucide-react';

const EnhancedAnalyticsSection: React.FC = () => {
  const { tasks } = useTask();
  const [timeRange, setTimeRange] = useState('30 days');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const analytics = useAdvancedAnalytics(tasks, timeRange);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // Placeholder for export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Advanced Analytics & Insights</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7 days">7 Days</SelectItem>
                  <SelectItem value="30 days">30 Days</SelectItem>
                  <SelectItem value="90 days">90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Analytics Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompletionTrendChart 
              data={analytics.completionTrend} 
              timeRange={timeRange}
            />
            <VelocityChart 
              data={analytics.velocityData}
              timeRange="week"
            />
          </div>
          <ProductivityHeatmap data={analytics.heatmapData} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <CompletionTrendChart 
              data={analytics.completionTrend} 
              timeRange={timeRange}
            />
            <VelocityChart 
              data={analytics.velocityData}
              timeRange="week"
            />
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TaskDistributionChart
              data={analytics.statusDistribution}
              title="Status Distribution"
              description="Breakdown of tasks by current status"
            />
            <TaskDistributionChart
              data={analytics.priorityDistribution}
              title="Priority Distribution"
              description="Breakdown of tasks by priority level"
            />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AnalyticsInsightsPanel analytics={analytics} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAnalyticsSection;
