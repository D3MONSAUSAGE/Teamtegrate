import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectReports from '@/components/reports/ProjectReports';
import TeamReports from '@/components/reports/TeamReports';
import TaskReports from '@/components/reports/TaskReports';
import TeamTimeReports from '@/components/reports/TeamTimeReports';
import DailyPerformanceReport from '@/components/reports/DailyPerformanceReport';
import AnalyticsOverview from '@/components/reports/AnalyticsOverview';
import EnhancedTeamAnalytics from '@/components/reports/EnhancedTeamAnalytics';
import SmartInsightsPanel from '@/components/reports/SmartInsightsPanel';
import ReportsFilters from '@/components/reports/ReportsFilters';
import { ReportsLoadingSkeleton } from '@/components/reports/LoadingSkeleton';
import { ReportsErrorBoundary } from '@/components/reports/ErrorBoundary';
import ManagerDashboard from '@/components/reports/manager/ManagerDashboard';
import EmployeeReports from '@/components/reports/EmployeeReports';
import TimelinePage from './TimelinePage';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import useTeamMembers from '@/hooks/useTeamMembers';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { DateRange } from "react-day-picker";
import { subDays, format, isAfter, isBefore } from 'date-fns';

const ReportsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data hooks
  const { user } = useAuth();
  const { tasks, projects } = useTask();
  const { teamMembersPerformance, managerPerformance } = useTeamMembers();
  
  // Filter states
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [timeRange, setTimeRange] = useState("30 days");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Filter and analyze data
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    // Apply time range filter
    if (timeRange !== "custom") {
      const days = timeRange === "7 days" ? 7 : timeRange === "30 days" ? 30 : 90;
      const cutoffDate = subDays(new Date(), days);
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt || task.updatedAt);
        return isAfter(taskDate, cutoffDate);
      });
    } else if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt || task.updatedAt);
        return isAfter(taskDate, dateRange.from!) && isBefore(taskDate, dateRange.to!);
      });
    }
    
    // Apply project filter
    if (selectedProjects.length > 0) {
      filtered = filtered.filter(task => 
        task.projectId && selectedProjects.includes(task.projectId)
      );
    }
    
    // Apply member filter
    if (selectedMembers.length > 0) {
      filtered = filtered.filter(task => 
        task.assignedToId && selectedMembers.includes(task.assignedToId)
      );
    }
    
    return filtered;
  }, [tasks, timeRange, dateRange, selectedProjects, selectedMembers]);
  
  // Analytics data
  const analyticsData = useAdvancedAnalytics(filteredTasks, timeRange);
  
  // Team data for enhanced analytics
  const enhancedTeamData = useMemo(() => {
    return teamMembersPerformance.map(member => ({
      ...member,
      recentActivity: Array.from({ length: 7 }, (_, i) => ({
        date: format(subDays(new Date(), 6 - i), 'MMM dd'),
        tasksCompleted: Math.floor(Math.random() * 5) + 1
      })),
      workloadScore: Math.min(100, (member.totalTasks / 15) * 100),
      qualityScore: Math.floor(Math.random() * 20) + 80,
      collaborationScore: Math.floor(Math.random() * 15) + 85
    }));
  }, [teamMembersPerformance]);
  
  // Calculate overview metrics
  const overviewMetrics = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === 'Completed').length;
    const overdueTasks = filteredTasks.filter(task => {
      const deadline = new Date(task.deadline);
      return isBefore(deadline, new Date()) && task.status !== 'Completed';
    }).length;
    const highPriorityTasks = filteredTasks.filter(task => task.priority === 'High').length;
    
    const averageCompletionRate = teamMembersPerformance.length > 0 
      ? teamMembersPerformance.reduce((sum, member) => sum + member.completionRate, 0) / teamMembersPerformance.length
      : 0;
    
    return {
      totalTasks,
      completedTasks,
      teamMembers: teamMembersPerformance.length,
      activeProjects: projects.filter(p => p.status !== 'Completed').length,
      averageCompletionRate: Math.round(averageCompletionRate),
      overdueTasks,
      highPriorityTasks,
      trendsData: {
        tasksChange: 5, // Mock data - would be calculated from historical data
        completionRateChange: 8,
        productivityScore: analyticsData.productivityScore
      }
    };
  }, [filteredTasks, teamMembersPerformance, projects, analyticsData]);
  
  // Available options for filters
  const availableProjects = projects.map(p => ({ id: p.id, title: p.title }));
  const availableMembers = teamMembersPerformance.map(m => ({ id: m.id, name: m.name }));
  
  // Check if user has manager+ access
  const hasManagerAccess = user?.role && ['manager', 'admin', 'superadmin'].includes(user.role);
  
  // Filter handlers
  const handleResetFilters = () => {
    setDateRange(undefined);
    setTimeRange("30 days");
    setSelectedProjects([]);
    setSelectedMembers([]);
  };
  
  const handleExport = async () => {
    try {
      const exportData = [
        ['Metric', 'Value'],
        ['Total Tasks', overviewMetrics.totalTasks.toString()],
        ['Completed Tasks', overviewMetrics.completedTasks.toString()],
        ['Team Members', overviewMetrics.teamMembers.toString()],
        ['Average Completion Rate', `${overviewMetrics.averageCompletionRate}%`],
        ['Overdue Tasks', overviewMetrics.overdueTasks.toString()],
        ['High Priority Tasks', overviewMetrics.highPriorityTasks.toString()],
        ['Active Projects', overviewMetrics.activeProjects.toString()]
      ];
      
      const csvContent = exportData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `team-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  return (
    <div className="space-y-6 px-2 sm:px-4 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights into team performance and project progress
          </p>
        </div>
      </div>
      
      <ReportsFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        selectedProjects={selectedProjects}
        onProjectsChange={setSelectedProjects}
        selectedMembers={selectedMembers}
        onMembersChange={setSelectedMembers}
        availableProjects={availableProjects}
        availableMembers={availableMembers}
        onReset={handleResetFilters}
        onExport={handleExport}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative w-full overflow-hidden">
          <TabsList className="relative w-full flex gap-1 overflow-x-auto scrollbar-none before:absolute before:right-0 before:top-0 before:bottom-0 before:w-4 before:bg-gradient-to-l before:from-background before:z-10 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-4 after:bg-gradient-to-r after:from-background after:z-10">
            <div className="flex gap-1 px-4 py-1 min-w-full justify-between md:justify-start">
              <TabsTrigger 
                value="overview" 
                className="flex-1 md:flex-none px-3 min-w-[100px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Overview
              </TabsTrigger>
              {hasManagerAccess && (
                <TabsTrigger 
                  value="manager" 
                  className="flex-1 md:flex-none px-3 min-w-[120px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  Manager Dashboard
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="team" 
                className="flex-1 md:flex-none px-3 min-w-[80px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Team Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="flex-1 md:flex-none px-3 min-w-[100px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Performance
              </TabsTrigger>
              <TabsTrigger 
                value="tasks" 
                className="flex-1 md:flex-none px-3 min-w-[80px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="projects" 
                className="flex-1 md:flex-none px-3 min-w-[80px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Projects
              </TabsTrigger>
              <TabsTrigger 
                value="time" 
                className="flex-1 md:flex-none px-3 min-w-[80px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Time
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="flex-1 md:flex-none px-3 min-w-[80px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Timeline
              </TabsTrigger>
              <TabsTrigger 
                value="employee" 
                className="flex-1 md:flex-none px-3 min-w-[110px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Employee
              </TabsTrigger>
        </div>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
          <ReportsErrorBoundary>
            <AnalyticsOverview {...overviewMetrics} />
          </ReportsErrorBoundary>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ReportsErrorBoundary>
                <EnhancedTeamAnalytics teamMembers={enhancedTeamData} />
              </ReportsErrorBoundary>
            </div>
            <div>
              <ReportsErrorBoundary>
                <SmartInsightsPanel 
                  teamData={overviewMetrics}
                  performanceData={teamMembersPerformance}
                />
              </ReportsErrorBoundary>
            </div>
          </div>
        </TabsContent>
        
        {hasManagerAccess && (
          <TabsContent value="manager" className="space-y-4">
            <ReportsErrorBoundary>
              <ManagerDashboard 
                timeRange={timeRange}
                teamMembers={teamMembersPerformance}
              />
            </ReportsErrorBoundary>
          </TabsContent>
        )}
        
        <TabsContent value="team" className="space-y-4">
          <ReportsErrorBoundary>
            <EnhancedTeamAnalytics teamMembers={enhancedTeamData} />
          </ReportsErrorBoundary>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <ReportsErrorBoundary>
            <DailyPerformanceReport />
          </ReportsErrorBoundary>
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <ReportsErrorBoundary>
            <TaskReports />
          </ReportsErrorBoundary>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-4">
          <ReportsErrorBoundary>
            <ProjectReports />
          </ReportsErrorBoundary>
        </TabsContent>
        
        <TabsContent value="time" className="space-y-4">
          <ReportsErrorBoundary>
            <TeamTimeReports />
          </ReportsErrorBoundary>
        </TabsContent>
        
        <TabsContent value="timeline" className="space-y-4">
          <ReportsErrorBoundary>
            <TimelinePage />
          </ReportsErrorBoundary>
        </TabsContent>

        <TabsContent value="employee" className="space-y-4">
          <ReportsErrorBoundary>
            <EmployeeReports 
              timeRange={timeRange}
              dateRange={dateRange}
              selectedMembers={selectedMembers}
            />
          </ReportsErrorBoundary>
        </TabsContent>
      </div>
    </Tabs>
    </div>
  );
};

export default ReportsPage;
