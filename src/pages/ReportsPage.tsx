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
import { format, subDays, isBefore } from 'date-fns';
import { toast } from 'sonner';
import type { ExportType } from '@/hooks/useEnhancedExport';
import { calculateDateRange, formatDateRangeForExport } from '@/utils/dateRangeUtils';

const ReportsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data hooks
  const { user } = useAuth();
  const { tasks, projects } = useTask();
  const { teamMembersPerformance, managerPerformance, teamMembers } = useTeamMembers();
  
  // Filter states
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [timeRange, setTimeRange] = useState("30 days");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Calculate date range based on timeRange selection
  const calculatedDateRange = useMemo(() => {
    return calculateDateRange(timeRange, dateRange);
  }, [timeRange, dateRange]);

  // Filter and analyze data
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    console.log('🔍 Starting task filtering with', filtered.length, 'total tasks');
    console.log('📅 Calculated date range:', calculatedDateRange);
    
    // Apply date filter using calculated date range
    const { from: startDate, to: endDate } = calculatedDateRange;
    console.log('🗓️ Date filter range:', startDate, 'to', endDate);
    
    filtered = filtered.filter(task => {
      const taskDate = new Date(task.createdAt || task.updatedAt);
      const isInRange = taskDate >= startDate && taskDate <= endDate;
      if (!isInRange) {
        console.log('❌ Filtered out task (date):', task.title, 'created:', taskDate);
      }
      return isInRange;
    });
    console.log('✅ After date filtering:', filtered.length, 'tasks');
    
    // Apply project filter
    if (selectedProjects.length > 0) {
      console.log('Applying project filter for projects:', selectedProjects);
      filtered = filtered.filter(task => 
        task.projectId && selectedProjects.includes(task.projectId)
      );
      console.log('After project filter:', filtered.length, 'tasks');
    }
    
    // Apply member filter - check both single and multiple assignees
    if (selectedMembers.length > 0) {
      console.log('Applying member filter for members:', selectedMembers);
      filtered = filtered.filter(task => {
        // Check single assignee
        if (task.assignedToId && selectedMembers.includes(task.assignedToId)) {
          return true;
        }
        // Check multiple assignees
        if (task.assignedToIds && task.assignedToIds.some(id => selectedMembers.includes(id))) {
          return true;
        }
        return false;
      });
      console.log('After member filter:', filtered.length, 'tasks');
    }
    
    console.log('🎯 Final filtered tasks count:', filtered.length);
    return filtered;
  }, [tasks, timeRange, dateRange, selectedProjects, selectedMembers, calculatedDateRange]);
  
  // Analytics data
  const analyticsData = useAdvancedAnalytics(filteredTasks, timeRange);
  
  // Team data for enhanced analytics - include email for compatibility
  const enhancedTeamData = useMemo(() => {
    return teamMembersPerformance.map(member => {
      const user = teamMembers.find(u => u.id === member.id);
      return {
        ...member,
        email: user?.email || '',
        recentActivity: Array.from({ length: 7 }, (_, i) => ({
          date: format(subDays(new Date(), 6 - i), 'MMM dd'),
          tasksCompleted: Math.floor(Math.random() * 5) + 1
        })),
        workloadScore: Math.min(100, (member.totalTasks / 15) * 100),
        qualityScore: Math.floor(Math.random() * 20) + 80,
        collaborationScore: Math.floor(Math.random() * 15) + 85
      };
    });
  }, [teamMembersPerformance, teamMembers]);
  
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
  
  const handleExport = async (exportType: ExportType, selectedUser?: string) => {
    try {
      const { downloadCSV } = await import('@/utils/exportUtils');
      
      // Use the calculated date range for exports
      const { from: startDate, to: endDate } = calculatedDateRange;

      // Create export options
      const exportOptions = {
        type: exportType,
        dateRange,
        timeRange,
        selectedProjects,
        selectedMembers,
        selectedUser
      };

      // Generate export data based on type
      let exportData;
      switch (exportType) {
        case 'detailed-tasks':
          exportData = generateDetailedTasksExport(filteredTasks, projects, availableMembers);
          break;
        case 'user-performance':
          exportData = generateUserPerformanceExport(filteredTasks, availableMembers, selectedUser);
          break;
        case 'comprehensive-user':
          exportData = selectedUser 
            ? generateComprehensiveUserReport(filteredTasks, projects, availableMembers, selectedUser)
            : generateOverviewExport(filteredTasks, projects, availableMembers);
          break;
        case 'project-breakdown':
          exportData = generateProjectBreakdownExport(filteredTasks, projects, availableMembers);
          break;
        default:
          exportData = generateOverviewExport(filteredTasks, projects, availableMembers);
      }

      // Add metadata
      const metadata = {
        exportType,
        dateRange: formatDateRangeForExport(calculatedDateRange),
        filters: [
          selectedProjects.length > 0 && `Projects: ${selectedProjects.length} selected`,
          selectedMembers.length > 0 && `Members: ${selectedMembers.length} selected`,
          selectedUser && `User: ${availableMembers.find(m => m.id === selectedUser)?.name || 'Unknown'}`
        ].filter(Boolean).join(', ') || 'No filters applied',
        generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        totalRecords: exportData.rows.length
      };

      const finalExportData = {
        ...exportData,
        metadata
      };
      
      downloadCSV(finalExportData);
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report. Please try again.');
    }
  };

  // Export generation functions
  const generateOverviewExport = (tasks: any[], projects: any[], teamMembers: any[]) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'Completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      filename: `overview-report-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      headers: ['Metric', 'Value'],
      rows: [
        ['Total Tasks', totalTasks.toString()],
        ['Completed Tasks', completedTasks.toString()],
        ['Overdue Tasks', overdueTasks.toString()],
        ['Completion Rate', `${completionRate}%`],
        ['Active Projects', projects.filter(p => p.status !== 'Completed').length.toString()],
        ['Team Members', teamMembers.length.toString()]
      ]
    };
  };

  const generateDetailedTasksExport = (tasks: any[], projects: any[], teamMembers: any[]) => {
    const headers = [
      'Task ID', 'Title', 'Description', 'Status', 'Priority', 'Created Date', 
      'Deadline', 'Assigned To', 'Project', 'Overdue'
    ];

    const rows = tasks.map(task => [
      task.id,
      task.title,
      task.description || '',
      task.status,
      task.priority,
      format(new Date(task.createdAt), 'yyyy-MM-dd'),
      format(new Date(task.deadline), 'yyyy-MM-dd'),
      task.assignedToName || teamMembers.find(m => m.id === task.assignedToId)?.name || 'Unassigned',
      projects.find(p => p.id === task.projectId)?.title || 'No Project',
      (new Date(task.deadline) < new Date() && task.status !== 'Completed') ? 'Yes' : 'No'
    ]);

    return {
      filename: `detailed-tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      headers,
      rows
    };
  };

  const generateUserPerformanceExport = (tasks: any[], teamMembers: any[], selectedUser?: string) => {
    const usersToAnalyze = selectedUser 
      ? teamMembers.filter(m => m.id === selectedUser)
      : teamMembers;

    const headers = [
      'User Name', 'Total Tasks', 'Completed Tasks', 'In Progress Tasks', 
      'Overdue Tasks', 'Completion Rate', 'High Priority Tasks'
    ];

    const rows = usersToAnalyze.map(member => {
      const userTasks = tasks.filter(t => 
        t.userId === member.id || t.assignedToId === member.id ||
        (t.assignedToIds && t.assignedToIds.includes(member.id))
      );
      
      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(t => t.status === 'Completed').length;
      const inProgressTasks = userTasks.filter(t => t.status === 'In Progress').length;
      const overdueTasks = userTasks.filter(t => 
        new Date(t.deadline) < new Date() && t.status !== 'Completed'
      ).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const highPriorityTasks = userTasks.filter(t => t.priority === 'High').length;

      return [
        member.name,
        totalTasks.toString(),
        completedTasks.toString(),
        inProgressTasks.toString(),
        overdueTasks.toString(),
        `${completionRate}%`,
        highPriorityTasks.toString()
      ];
    });

    const filename = selectedUser 
      ? `user-performance-${usersToAnalyze[0]?.name?.replace(/\s+/g, '-') || 'user'}-${format(new Date(), 'yyyy-MM-dd')}.csv`
      : `team-performance-${format(new Date(), 'yyyy-MM-dd')}.csv`;

    return { filename, headers, rows };
  };

  const generateComprehensiveUserReport = (tasks: any[], projects: any[], teamMembers: any[], selectedUser: string) => {
    const user = teamMembers.find(m => m.id === selectedUser);
    if (!user) return { filename: '', headers: [], rows: [] };

    const userTasks = tasks.filter(t => 
      t.userId === selectedUser || t.assignedToId === selectedUser ||
      (t.assignedToIds && t.assignedToIds.includes(selectedUser))
    );

    const headers = [
      'Task ID', 'Title', 'Description', 'Status', 'Priority', 'Project', 
      'Created Date', 'Deadline', 'Completed Date', 'Days to Complete', 
      'Is Overdue', 'Task Type'
    ];

    const rows = userTasks.map(task => {
      const project = projects.find(p => p.id === task.projectId);
      const createdDate = new Date(task.createdAt);
      const deadline = new Date(task.deadline);
      const completedDate = task.status === 'Completed' ? new Date(task.updatedAt) : null;
      const daysToComplete = completedDate ? 
        Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) : 
        '';
      const isOverdue = deadline < new Date() && task.status !== 'Completed';
      const taskType = task.userId === selectedUser ? 'Created' : 'Assigned';

      return [
        task.id,
        task.title || '',
        task.description || '',
        task.status || '',
        task.priority || '',
        project?.title || 'No Project',
        format(createdDate, 'yyyy-MM-dd'),
        format(deadline, 'yyyy-MM-dd'),
        completedDate ? format(completedDate, 'yyyy-MM-dd') : '',
        daysToComplete.toString(),
        isOverdue ? 'Yes' : 'No',
        taskType
      ];
    });

    return {
      filename: `comprehensive-user-report-${user.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      headers,
      rows
    };
  };

  const generateProjectBreakdownExport = (tasks: any[], projects: any[], teamMembers: any[]) => {
    const headers = [
      'Project Name', 'Status', 'Manager', 'Total Tasks', 'Completed Tasks', 
      'Completion Rate', 'Team Members'
    ];

    const rows = projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const manager = teamMembers.find(m => m.id === project.managerId)?.name || 'Unassigned';

      return [
        project.title,
        project.status || 'To Do',
        manager,
        totalTasks.toString(),
        completedTasks.toString(),
        `${completionRate}%`,
        (project.teamMembers?.length || 0).toString()
      ];
    });

    return {
      filename: `project-breakdown-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      headers,
      rows
    };
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
