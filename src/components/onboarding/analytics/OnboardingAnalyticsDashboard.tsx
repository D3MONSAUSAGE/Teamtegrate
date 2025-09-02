import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Download,
  BarChart3,
  PieChart,
  TrendingDown,
  Star
} from 'lucide-react';
import { useOnboardingAnalytics } from '@/hooks/onboarding/useOnboardingAnalytics';
import { OverviewMetrics } from './OverviewMetrics';
import { CompletionTrendsChart } from './CompletionTrendsChart';
import { TemplatePerformanceChart } from './TemplatePerformanceChart';
import { TaskBottlenecksChart } from './TaskBottlenecksChart';
import { FeedbackInsightsChart } from './FeedbackInsightsChart';
import { CohortAnalysisChart } from './CohortAnalysisChart';

export const OnboardingAnalyticsDashboard: React.FC = () => {
  const { data: analytics, isLoading, error } = useOnboardingAnalytics();
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
            <p className="text-red-500">Failed to load analytics data: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground">
              No onboarding data available for analysis yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleExportData = () => {
    const dataToExport = {
      overview: analytics.overview,
      templatePerformance: analytics.templatePerformance,
      completionTrends: analytics.completionTrends,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onboarding-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Onboarding Analytics</h2>
          <p className="text-muted-foreground">
            Insights and performance metrics for your onboarding program
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <OverviewMetrics overview={analytics.overview} />

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="bottlenecks" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Bottlenecks
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="cohorts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cohorts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <CompletionTrendsChart data={analytics.completionTrends} />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatePerformanceChart data={analytics.templatePerformance} />
        </TabsContent>

        <TabsContent value="bottlenecks">
          <TaskBottlenecksChart data={analytics.taskBottlenecks} />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackInsightsChart data={analytics.feedbackInsights} />
        </TabsContent>

        <TabsContent value="cohorts">
          <CohortAnalysisChart data={analytics.cohortAnalysis} />
        </TabsContent>
      </Tabs>
    </div>
  );
};