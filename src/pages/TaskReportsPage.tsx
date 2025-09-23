import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useReportFilters } from '@/hooks/useReportFilters';
import { ReportFilters } from '@/components/finance/reports/ReportFilters';
import { DailyCompletionTab } from '@/components/reports/tabs/DailyCompletionTab';
import { WeeklyOverviewTab } from '@/components/reports/tabs/WeeklyOverviewTab';
import { ArrowLeft, BarChart3, Download, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const TaskReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use centralized report filters
  const {
    timeRange,
    dateRange,
    selectedTeamId,
    selectedUserId,
    calculatedDateRange,
    setTimeRange,
    setDateRange,
    setSelectedTeamId,
    setSelectedUserId
  } = useReportFilters();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Reports refreshed successfully!');
    }, 1500);
  };

  const handleExport = () => {
    toast.success('Export started! Check your downloads folder.');
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard/reports" 
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Reports</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                Task Reports
              </h1>
              <p className="text-muted-foreground">Detailed insights into task completion and team performance</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
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
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="daily" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Daily View
                </TabsTrigger>
                <TabsTrigger value="weekly" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Weekly View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="space-y-4">
                <DailyCompletionTab 
                  userId={selectedUserId || user.id}
                  userName={selectedUserId ? 'Selected User' : user.name || 'Current User'}
                  selectedDate={dateRange?.from || new Date()}
                  onDateChange={(date) => setDateRange({ from: date, to: date })}
                />
              </TabsContent>

              <TabsContent value="weekly" className="space-y-4">
                <WeeklyOverviewTab 
                  userId={selectedUserId || user.id}
                  userName={selectedUserId ? 'Selected User' : user.name || 'Current User'}
                  timeRange={timeRange}
                  dateRange={dateRange}
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