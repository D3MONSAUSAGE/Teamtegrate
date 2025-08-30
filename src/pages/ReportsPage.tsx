import React, { useState, useMemo, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Users, CheckCircle, Clock, AlertCircle, BarChart3, PieChart, Activity, FileText, Calendar } from "lucide-react";
import AnalyticsOverview from '@/components/reports/AnalyticsOverview';
import EnhancedTeamAnalytics from '@/components/reports/EnhancedTeamAnalytics';
import SmartInsightsPanel from '@/components/reports/SmartInsightsPanel';
import ReportsFilters from '@/components/reports/ReportsFilters';
import ProjectReports from '@/components/reports/ProjectReports';
import TaskReports from '@/components/reports/TaskReports';
import TeamTimeReports from '@/components/reports/TeamTimeReports';
import DailyPerformanceReport from '@/components/reports/DailyPerformanceReport';
import ManagerDashboard from '@/components/reports/manager/ManagerDashboard';
import EmployeeReports from '@/components/reports/EmployeeReports';
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

// Dashboard Executive Summary Component
const ExecutiveSummary: React.FC<{ metrics: any; isLoading: boolean }> = ({ metrics, isLoading }) => {
  const summaryCards = [
    {
      title: "Total Tasks",
      value: metrics.totalTasks,
      icon: FileText,
      change: metrics.trendsData.tasksChange,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Completed",
      value: metrics.completedTasks,
      icon: CheckCircle,
      change: metrics.trendsData.completionRateChange,
      color: "bg-green-500/10 text-green-600",
    },
    {
      title: "Team Members",
      value: metrics.teamMembers,
      icon: Users,
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      title: "Active Projects",
      value: metrics.activeProjects,
      icon: BarChart3,
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      title: "Completion Rate",
      value: `${metrics.averageCompletionRate}%`,
      icon: TrendingUp,
      change: metrics.trendsData.completionRateChange,
      color: "bg-cyan-500/10 text-cyan-600",
    },
    {
      title: "Overdue Tasks",
      value: metrics.overdueTasks,
      icon: AlertCircle,
      color: "bg-red-500/10 text-red-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {summaryCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {card.change && (
                  <Badge variant={card.change > 0 ? "default" : "destructive"} className="text-xs">
                    {card.change > 0 ? "+" : ""}{card.change}%
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Quick Actions Panel Component
const QuickActionsPanel: React.FC<{ onExport: (type: ExportType) => void }> = ({ onExport }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Common reports and actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          onClick={() => onExport('overview')}
          className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Export Overview</p>
              <p className="text-xs text-muted-foreground">General metrics summary</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => onExport('detailed-tasks')}
          className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Export Task Details</p>
              <p className="text-xs text-muted-foreground">Complete task breakdown</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => onExport('user-performance')}
          className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Export Team Performance</p>
              <p className="text-xs text-muted-foreground">Individual metrics</p>
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
};

const ReportsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("dashboard");
  
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
      
      {/* Simplified Sticky Filter Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b pb-4">
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
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Simplified Tab Navigation - 5 tabs instead of 9 */}
        <div className="relative w-full overflow-hidden">
          <TabsList className="relative w-full h-12 bg-muted/30 p-1">
            <div className="flex w-full justify-between">
              <TabsTrigger 
                value="dashboard" 
                className="flex-1 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Activity className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Dash</span>
              </TabsTrigger>
              <TabsTrigger 
                value="team" 
                className="flex-1 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Team Analytics</span>
                <span className="sm:hidden">Team</span>
              </TabsTrigger>
              <TabsTrigger 
                value="projects" 
                className="flex-1 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Projects & Tasks</span>
                <span className="sm:hidden">Tasks</span>
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="flex-1 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Time & Performance</span>
                <span className="sm:hidden">Time</span>
              </TabsTrigger>
              {hasManagerAccess && (
                <TabsTrigger 
                  value="advanced" 
                  className="flex-1 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Advanced Reports</span>
                  <span className="sm:hidden">Advanced</span>
                </TabsTrigger>
              )}
            </div>
          </TabsList>
        </div>

        <div className="mt-6 space-y-6">
          {/* Dashboard Tab - New Executive Summary Layout */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="space-y-6">
              {/* Executive Summary Bar */}
              <ExecutiveSummary 
                metrics={overviewMetrics} 
                isLoading={teamMembersPerformance.length === 0} 
              />
              
              {/* Main Dashboard Layout - 60/40 split */}
              <div className="grid gap-6 lg:grid-cols-5">
                {/* Left Column - Primary insights (60%) */}
                <div className="lg:col-span-3 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Performance Overview
                      </CardTitle>
                      <CardDescription>
                        Key performance indicators and trends
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsOverview
                        totalTasks={overviewMetrics.totalTasks}
                        completedTasks={overviewMetrics.completedTasks}
                        teamMembers={overviewMetrics.teamMembers}
                        activeProjects={overviewMetrics.activeProjects}
                        averageCompletionRate={overviewMetrics.averageCompletionRate}
                        trendsData={overviewMetrics.trendsData}
                      />
                    </CardContent>
                  </Card>

                  {/* Team Performance Hub */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Performance Hub
                      </CardTitle>
                      <CardDescription>
                        Interactive team analytics and insights
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                        <EnhancedTeamAnalytics teamMembers={enhancedTeamData.slice(0, 5)} />
                      </Suspense>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Right Column - Secondary metrics and actions (40%) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Smart Insights - Prominent placement */}
                  <SmartInsightsPanel
                    teamData={{
                      totalTasks: overviewMetrics.totalTasks,
                      completedTasks: overviewMetrics.completedTasks,
                      teamMembers: overviewMetrics.teamMembers,
                      averageCompletionRate: overviewMetrics.averageCompletionRate,
                      overdueTasks: overviewMetrics.overdueTasks,
                      highPriorityTasks: overviewMetrics.highPriorityTasks
                    }}
                    performanceData={teamMembersPerformance}
                  />

                  {/* Quick Actions Panel */}
                  <QuickActionsPanel onExport={handleExport} />

                  {/* Recent Activity Feed */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div className="text-sm">
                            <p className="font-medium">5 tasks completed today</p>
                            <p className="text-xs text-muted-foreground">Team average: 3.2 tasks</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <div className="text-sm">
                            <p className="font-medium">2 tasks approaching deadline</p>
                            <p className="text-xs text-muted-foreground">Due within 24 hours</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <div className="text-sm">
                            <p className="font-medium">Productivity increased 8%</p>
                            <p className="text-xs text-muted-foreground">vs last week</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Team Analytics Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Detailed Team Analytics
                </CardTitle>
                <CardDescription>
                  Comprehensive team performance analysis and member insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <EnhancedTeamAnalytics teamMembers={enhancedTeamData} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects & Tasks Tab - Combined */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Task Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <TaskReports />
                  </Suspense>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Project Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <ProjectReports />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Time & Performance Tab - Combined */}
          <TabsContent value="performance" className="space-y-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Tracking & Performance
                  </CardTitle>
                  <CardDescription>
                    Time management and performance analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                      <TeamTimeReports />
                    </Suspense>
                    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                      <DailyPerformanceReport />
                    </Suspense>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Reports Tab - Manager Dashboard and Employee Reports */}
          {hasManagerAccess && (
            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Manager Dashboard
                    </CardTitle>
                    <CardDescription>
                      Advanced management insights and detailed reporting
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                      <ManagerDashboard 
                        timeRange={timeRange}
                        teamMembers={teamMembers}
                      />
                    </Suspense>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Employee-Specific Reports
                    </CardTitle>
                    <CardDescription>
                      Individual employee performance and detailed analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                      <EmployeeReports 
                        timeRange={timeRange}
                        selectedMembers={selectedMembers}
                      />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default ReportsPage;