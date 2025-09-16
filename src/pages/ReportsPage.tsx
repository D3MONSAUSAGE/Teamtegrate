import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { hasRoleAccess } from '@/contexts/auth';
import { User } from '@/types';
import { useEmployeeReports } from '@/hooks/useEmployeeReports';
import { useTeamAnalytics } from '@/hooks/team/useTeamAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Modern Dashboard Components
import { ModernReportsHeader } from '@/components/reports/modern/ModernReportsHeader';
import { ExecutiveSummary } from '@/components/reports/modern/ExecutiveSummary';
import { PerformanceGrid } from '@/components/reports/modern/PerformanceGrid';
import { InsightsPanel } from '@/components/reports/modern/InsightsPanel';
import { DetailedAnalytics } from '@/components/reports/modern/DetailedAnalytics';
import TeamReports from '@/components/reports/TeamReports';
import { ComprehensiveReportsPanel } from '@/components/reports/ComprehensiveReportsPanel';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { tasks, fetchTasks, isLoading: tasksLoading } = useTask();
  
  // State management
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7 days');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('individual');

  // Fetch tasks when component mounts
  React.useEffect(() => {
    if (user && tasks.length === 0) {
      fetchTasks();
    }
  }, [user, tasks.length, fetchTasks]);
  
  // Data fetching for the selected user (defaults to current user)
  const viewingUserId = selectedUser?.id || user?.id;
  const viewingUserName = selectedUser?.name || user?.name || '';
  
  const {
    taskStats,
    hoursStats,
    contributions,
    taskStatsSummary,
    hoursStatsSummary,
    isLoading: reportsLoading,
    error
  } = useEmployeeReports({
    userId: viewingUserId || '',
    timeRange
  });

  // Team analytics data
  const { analytics: teamAnalytics, isLoading: teamLoading } = useTeamAnalytics();

  const isLoading = tasksLoading || reportsLoading;

  // Handlers
  const handleUserSelect = (userId: string, userName: string) => {
    setSelectedUser({ 
      id: userId, 
      name: userName,
      email: `${userName.toLowerCase().replace(' ', '.')}@company.com`,
      role: 'user',
      organizationId: user?.organizationId || '',
      createdAt: new Date()
    } as User);
    setSearchQuery('');
  };
  
  const handleBackToPersonal = () => {
    setSelectedUser(null);
  };
  
  const handleExport = async () => {
    try {
      const { downloadCSV } = await import('@/utils/exportUtils');
      
      const targetUserName = viewingUserName;
      const isViewingSelf = !selectedUser;
      
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const userStr = isViewingSelf ? 'my' : targetUserName.toLowerCase().replace(/\s+/g, '-');
      const timeStr = timeRange === '7 days' ? 'weekly' : timeRange === '30 days' ? 'monthly' : 'custom';
      
      const exportData = {
        filename: `${userStr}-performance-report-${timeStr}-${dateStr}.csv`,
        headers: ['Category', 'Metric', 'Value', 'Period'],
        rows: [
          ['User Info', 'Name', targetUserName, ''],
          ['User Info', 'Report Period', timeRange, ''],
          ['User Info', 'Generated At', format(new Date(), 'yyyy-MM-dd HH:mm:ss'), ''],
          ['', '', '', ''],
          ['Tasks', 'Total Tasks', (taskStatsSummary?.total_tasks || 0).toString(), timeRange],
          ['Tasks', 'Completed Tasks', (taskStatsSummary?.completed_tasks || 0).toString(), timeRange],
          ['Tasks', 'Completion Rate', `${Math.round(taskStatsSummary?.completion_rate || 0)}%`, timeRange],
          ['', '', '', ''],
          ['Time', 'Total Hours', Math.round(hoursStatsSummary?.total_hours || 0).toString(), timeRange],
          ['Time', 'Daily Average', (hoursStatsSummary?.avg_daily_hours || 0).toFixed(1), timeRange],
          ['Time', 'Overtime Hours', (hoursStatsSummary?.overtime_hours || 0).toString(), timeRange],
          ['', '', '', ''],
          ['Projects', 'Active Projects', (contributions?.length || 0).toString(), timeRange],
          ...((contributions || []).map(project => [
            'Project Detail',
            project.project_title,
            `${project.task_count} tasks (${Math.round(project.completion_rate)}% complete)`,
            ''
          ]))
        ],
        metadata: {
          exportType: 'comprehensive-user',
          dateRange: timeRange,
          filters: isViewingSelf ? 'Personal dashboard' : `Team member: ${targetUserName}`,
          generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          totalRecords: (taskStatsSummary?.total_tasks || 0) + (contributions?.length || 0)
        }
      };
      
      downloadCSV(exportData);
      toast.success(`${isViewingSelf ? 'Your' : `${targetUserName}'s`} performance report exported successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report. Please try again.');
    }
  };

  const handleRefresh = () => {
    toast.success('Data refreshed!');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-pulse h-12 w-12 bg-muted rounded-full mx-auto" />
          <div className="text-muted-foreground">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-destructive">Failed to load dashboard data</div>
          <button 
            onClick={handleRefresh}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        <ModernReportsHeader
          currentUser={user}
          selectedUser={selectedUser}
          timeRange={timeRange}
          searchQuery={searchQuery}
          activeTab={activeTab}
          onTimeRangeChange={setTimeRange}
          onSearchChange={setSearchQuery}
          onUserSelect={handleUserSelect}
          onBackToPersonal={handleBackToPersonal}
          onTabChange={setActiveTab}
          onExport={handleExport}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="individual" className="space-y-8 mt-6">
            {/* Comprehensive Reports Panel */}
            <ComprehensiveReportsPanel
              userId={viewingUserId || ''}
              userName={viewingUserName}
              timeRange={timeRange}
              dateRange={undefined}
            />
          </TabsContent>
          
          <TabsContent value="legacy" className="space-y-8 mt-6">
            {/* Executive Summary Cards */}
            <ExecutiveSummary
              taskStats={taskStatsSummary}
              hoursStats={hoursStatsSummary}
              contributions={contributions}
              isLoading={isLoading}
            />

            {/* Performance Visualization Grid */}
            <PerformanceGrid
              taskStats={taskStatsSummary}
              hoursStats={hoursStatsSummary}
              contributions={contributions}
              isLoading={isLoading}
            />

            {/* Split Layout for Insights and Detailed Analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-1">
                <InsightsPanel
                  taskStats={taskStatsSummary}
                  hoursStats={hoursStatsSummary}
                  contributions={contributions}
                  isLoading={isLoading}
                />
              </div>
              <div className="xl:col-span-2">
                <DetailedAnalytics
                  taskStats={taskStatsSummary}
                  hoursStats={hoursStatsSummary}
                  contributions={contributions}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="team" className="space-y-8 mt-6">
            <TeamReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportsPage;