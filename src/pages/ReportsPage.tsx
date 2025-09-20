import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTaskReports } from '@/hooks/useTaskReports';
import { useReportFilters } from '@/hooks/useReportFilters';
import { ReportFilters } from '@/components/reports/core/ReportFilters';
import { DailyCompletionReport } from '@/components/reports/core/DailyCompletionReport';
import { WeeklyOverviewReport } from '@/components/reports/core/WeeklyOverviewReport';
import { TeamEffectivenessReport } from '@/components/reports/core/TeamEffectivenessReport';
import { ProjectAnalyticsReport } from '@/components/reports/core/ProjectAnalyticsReport';
import { BarChart3, Calendar, Users, FolderOpen } from 'lucide-react';
import { downloadCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  
  // Use centralized report filters
  const {
    timeRange,
    dateRange,
    selectedTeamId,
    selectedUserId,
    setTimeRange,
    setDateRange,
    setSelectedTeamId,
    setSelectedUserId
  } = useReportFilters();

  // Fetch unified report data
  const {
    dailyData,
    weeklyData,
    teamData,
    projectData,
    isLoading,
    error,
    range
  } = useTaskReports({
    timeRange,
    dateRange,
    teamId: selectedTeamId || undefined,
    userId: selectedUserId || undefined
  });

  const handleExport = () => {
    try {
      let exportData;
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      
      switch (activeTab) {
        case 'daily':
          exportData = {
            filename: `daily-completion-report-${dateStr}.csv`,
            headers: ['Date', 'Total Tasks', 'Completed', 'Completion Rate', 'High Priority', 'Medium Priority', 'Low Priority'],
            rows: dailyData.map(day => [
              day.date,
              day.total_tasks.toString(),
              day.completed_tasks.toString(),
              `${day.completion_rate}%`,
              day.high_priority.toString(),
              day.medium_priority.toString(),
              day.low_priority.toString()
            ]),
            metadata: {
              exportType: 'daily-completion',
              dateRange: `${range.startDate} to ${range.endDate}`,
              generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
              totalRecords: dailyData.length
            }
          };
          break;
          
        case 'weekly':
          exportData = {
            filename: `weekly-overview-report-${dateStr}.csv`,
            headers: ['Week Start', 'Assigned Tasks', 'Completed Tasks', 'Overdue Tasks', 'Completion Velocity'],
            rows: weeklyData.map(week => [
              week.week_start,
              week.assigned_tasks.toString(),
              week.completed_tasks.toString(),
              week.overdue_tasks.toString(),
              `${week.completion_velocity}%`
            ]),
            metadata: {
              exportType: 'weekly-overview',
              dateRange: `${range.startDate} to ${range.endDate}`,
              generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
              totalRecords: weeklyData.length
            }
          };
          break;
          
        case 'team':
          exportData = {
            filename: `team-effectiveness-report-${dateStr}.csv`,
            headers: ['Team Name', 'Members', 'Total Tasks', 'Completed', 'Collaboration Score'],
            rows: teamData.map(team => [
              team.team_name,
              team.member_count.toString(),
              team.total_tasks.toString(),
              team.completed_tasks.toString(),
              `${team.collaboration_score}%`
            ]),
            metadata: {
              exportType: 'team-effectiveness',
              dateRange: `${range.startDate} to ${range.endDate}`,
              generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
              totalRecords: teamData.length
            }
          };
          break;
          
        case 'project':
          exportData = {
            filename: `project-analytics-report-${dateStr}.csv`,
            headers: ['Project Name', 'Team Size', 'Total Tasks', 'Completed', 'Completion Rate', 'Overdue'],
            rows: projectData.map(project => [
              project.project_title,
              project.team_members.toString(),
              project.total_tasks.toString(),
              project.completed_tasks.toString(),
              `${project.completion_rate}%`,
              project.overdue_count.toString()
            ]),
            metadata: {
              exportType: 'project-analytics',
              dateRange: `${range.startDate} to ${range.endDate}`,
              generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
              totalRecords: projectData.length
            }
          };
          break;
          
        default:
          throw new Error('Invalid report type');
      }
      
      downloadCSV(exportData);
      toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} report exported successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report. Please try again.');
    }
  };

  const handleRefresh = () => {
    // The useTaskReports hook will automatically refetch when dependencies change
    toast.success('Reports refreshed!');
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-destructive">Failed to load report data</div>
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Task Reports</h1>
            <p className="text-muted-foreground">Comprehensive insights into task completion and team performance</p>
          </div>
        </div>

        {/* Filters */}
        <ReportFilters
          timeRange={timeRange}
          dateRange={dateRange}
          selectedTeamId={selectedTeamId || undefined}
          selectedUserId={selectedUserId || undefined}
          onTimeRangeChange={setTimeRange}
          onDateRangeChange={setDateRange}
          onTeamChange={(value) => setSelectedTeamId(value === 'all' ? null : value)}
          onUserChange={(value) => setSelectedUserId(value === 'all' ? null : value)}
          onExport={handleExport}
          onRefresh={handleRefresh}
          showTeamFilter={true}
        />

        {/* Reports Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Daily Completion
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Weekly Overview
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Effectiveness
            </TabsTrigger>
            <TabsTrigger value="project" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Project Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-6">
            <DailyCompletionReport data={dailyData} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            <WeeklyOverviewReport data={weeklyData} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <TeamEffectivenessReport data={teamData} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="project" className="mt-6">
            <ProjectAnalyticsReport data={projectData} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportsPage;