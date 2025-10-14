import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from 'react-day-picker';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useReportFilters } from '@/hooks/useReportFilters';
import { ReportFilters } from '@/components/finance/reports/ReportFilters';
import { DailyCompletionTab } from '@/components/reports/tabs/DailyCompletionTab';
import { WeeklyOverviewTab } from '@/components/reports/tabs/WeeklyOverviewTab';
import { PerformanceTab } from '@/components/reports/PerformanceTab';
import { ArrowLeft, BarChart3, Download, RefreshCw, Calendar, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useDailyReport, useWeeklyReport } from '@/hooks/useTaskReports';
import { useTaskReportExport } from '@/hooks/useTaskReportExport';

export const TaskReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use centralized report filters with unified filter object
  const {
    // Legacy props for filter UI
    timeRange,
    dateRange,
    selectedTeamId,
    selectedUserId,
    calculatedDateRange,
    setTimeRange,
    setDateRange,
    setSelectedTeamId,
    setSelectedUserId,
    // New unified filter system
    filter,
    activeTab,
    setActiveTab
  } = useReportFilters();

  // Fetch report data based on active tab
  const { metrics: dailyMetrics, buckets: dailyBuckets, isLoading: isDailyLoading } = useDailyReport(filter);
  const { data: weeklyData, isLoading: isWeeklyLoading } = useWeeklyReport(filter);

  // Export functionality
  const { exportDaily, exportWeekly, exportPerformance, isExporting } = useTaskReportExport({
    filter,
    teamName: selectedTeamId ? 'Selected Team' : undefined,
    userName: selectedUserId ? 'Selected User' : undefined
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Reports refreshed successfully!');
    }, 1500);
  };

  const handleExport = async () => {
    if (isExporting) return;

    try {
      if (activeTab === 'daily') {
        if (!dailyMetrics || !dailyBuckets) {
          toast.error('No daily data to export');
          return;
        }
        await exportDaily(dailyMetrics, dailyBuckets);
      } else if (activeTab === 'weekly') {
        if (!weeklyData || weeklyData.length === 0) {
          toast.error('No weekly data to export');
          return;
        }
        await exportWeekly(weeklyData);
      } else if (activeTab === 'performance') {
        // Performance data will be passed from PerformanceTab
        toast.info('Please use the export button within the Performance tab');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-pulse h-12 w-12 bg-muted rounded-full mx-auto" />
          <div className="text-muted-foreground">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header with Navigation */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Link 
                to="/dashboard/reports" 
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm sm:text-base">Back</span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  Task Reports
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Task completion & team performance insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[44px]"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExport}
                disabled={isExporting || (activeTab === 'daily' && isDailyLoading) || (activeTab === 'weekly' && isWeeklyLoading)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Download className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Section - Modern Responsive Design */}
        <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-muted/5">
          <CardContent className="p-4 sm:p-6">
            <ReportFilters
              timeRange={timeRange}
              dateRange={dateRange}
              selectedTeamId={selectedTeamId}
              selectedUserId={selectedUserId}
              onTimeRangeChange={setTimeRange}
              onDateRangeChange={setDateRange}
              onTeamChange={setSelectedTeamId}
              onUserChange={setSelectedUserId}
              calculatedDateRange={calculatedDateRange}
              showTimeRange={activeTab === 'weekly'}
            />
          </CardContent>
        </Card>

        {/* Reports Content */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                <TabsList className="inline-grid w-full min-w-[300px] sm:max-w-2xl grid-cols-3 bg-gradient-to-r from-muted/50 to-muted/30 p-1 rounded-lg">
                  <TabsTrigger 
                    value="daily" 
                    className="flex items-center justify-center gap-1 sm:gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md transition-all min-h-[44px] text-xs sm:text-sm"
                  >
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Daily</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="weekly" 
                    className="flex items-center justify-center gap-1 sm:gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md transition-all min-h-[44px] text-xs sm:text-sm"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Weekly</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="performance" 
                    className="flex items-center justify-center gap-1 sm:gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-md transition-all min-h-[44px] text-xs sm:text-sm"
                  >
                    <TrendingUp className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Performance</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="daily" className="space-y-4">
                <DailyCompletionTab 
                  filter={filter}
                  onDateChange={(date) => setDateRange({ from: date, to: date })}
                />
              </TabsContent>

              <TabsContent value="weekly" className="space-y-4">
                <WeeklyOverviewTab 
                  filter={filter}
                />
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <PerformanceTab 
                  filter={filter}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskReportsPage;