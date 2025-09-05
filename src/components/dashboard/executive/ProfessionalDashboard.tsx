import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { usePersonalTasks } from '@/hooks/usePersonalTasks';
import { useProjects } from '@/hooks/useProjects';
import { useTask } from '@/contexts/task';
import ExecutiveSummaryHeader from './ExecutiveSummaryHeader';
import ExecutiveMetricCard, { ExecutiveMetricData } from './ExecutiveMetricCard';
import DataVisualizationCard from './DataVisualizationCard';
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';
import { 
  Target, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Briefcase,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Task, Project } from '@/types';
import { calculateDailyScore } from '@/contexts/task/taskMetrics';
import { isTaskOverdue } from '@/utils/taskUtils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useTaskRealtime } from '@/hooks/useTaskRealtime';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import { useIsMobile } from '@/hooks/use-mobile';

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Real-time updates
  useTaskRealtime();
  
  // Data hooks
  const { tasks: personalTasks, isLoading: tasksLoading } = usePersonalTasks();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { createTask, updateTask } = useTask();
  
  // State
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Get time-based greeting
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (tasksLoading || projectsLoading) {
      return {
        todaysTasks: [],
        upcomingTasks: [],
        overdueTasks: [],
        completedTasks: [],
        inProgressTasks: [],
        activeProjects: [],
        dailyScore: { percentage: 0, score: 0, maxScore: 0 }
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const todaysTasks = personalTasks.filter(task => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    const upcomingTasks = personalTasks.filter(task => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate > today && taskDate <= nextWeek;
    });

    const overdueTasks = personalTasks.filter(task => isTaskOverdue(task));
    const completedTasks = personalTasks.filter(task => task.status === 'Completed');
    const inProgressTasks = personalTasks.filter(task => task.status === 'In Progress');
    const activeProjects = projects.filter(project => !project.isCompleted);
    const dailyScore = calculateDailyScore(personalTasks);

    return {
      todaysTasks,
      upcomingTasks,
      overdueTasks,
      completedTasks,
      inProgressTasks,
      activeProjects,
      dailyScore
    };
  }, [personalTasks, projects, tasksLoading, projectsLoading]);

  // Primary KPI metrics for header
  const primaryMetrics = useMemo(() => [
    {
      id: 'productivity',
      label: 'Productivity Score',
      value: `${metrics.dailyScore.percentage}%`,
      change: {
        value: '+12%',
        trend: 'up' as const,
        timeframe: 'vs last week'
      },
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
    },
    {
      id: 'today',
      label: "Today's Tasks",
      value: metrics.todaysTasks.length,
      change: {
        value: metrics.todaysTasks.length > 0 ? '+2' : '0',
        trend: metrics.todaysTasks.length > 2 ? ('up' as const) : ('neutral' as const),
        timeframe: 'scheduled'
      },
      icon: Target,
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'projects',
      label: 'Active Projects',
      value: metrics.activeProjects.length,
      change: {
        value: '+1',
        trend: 'up' as const,
        timeframe: 'this month'
      },
      icon: Briefcase,
      color: 'bg-accent/10 text-accent'
    },
    {
      id: 'overdue',
      label: 'Overdue Items',
      value: metrics.overdueTasks.length,
      change: {
        value: metrics.overdueTasks.length > 0 ? `-${Math.min(2, metrics.overdueTasks.length)}` : '0',
        trend: metrics.overdueTasks.length < 3 ? ('up' as const) : ('down' as const),
        timeframe: 'needs attention'
      },
      icon: AlertTriangle,
      color: metrics.overdueTasks.length > 0 ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
    }
  ], [metrics]);

  // Executive metric cards data
  const executiveMetrics: ExecutiveMetricData[] = useMemo(() => [
    {
      id: 'completion-rate',
      title: 'Task Completion Rate',
      value: `${Math.round((metrics.completedTasks.length / Math.max(personalTasks.length, 1)) * 100)}%`,
      subtitle: 'Overall performance',
      change: {
        value: '+8%',
        trend: 'up',
        period: 'vs last month'
      },
      progress: {
        value: metrics.completedTasks.length,
        max: personalTasks.length,
      },
      status: {
        label: metrics.completedTasks.length > metrics.inProgressTasks.length ? 'Excellent' : 'Good',
        variant: metrics.completedTasks.length > metrics.inProgressTasks.length ? 'default' : 'secondary'
      },
      icon: CheckCircle,
      sparklineData: [65, 72, 68, 75, 78, 82, 85],
      actionable: true,
      onClick: () => navigate('/dashboard/tasks')
    },
    {
      id: 'workload',
      title: 'Current Workload',
      value: metrics.inProgressTasks.length,
      subtitle: 'Tasks in progress',
      change: {
        value: '+3',
        trend: 'up',
        period: 'this week'
      },
      status: {
        label: metrics.inProgressTasks.length > 5 ? 'High' : 'Moderate',
        variant: metrics.inProgressTasks.length > 5 ? 'outline' : 'default'
      },
      icon: Activity,
      actionable: true,
      onClick: () => navigate('/dashboard/tasks?filter=in-progress')
    },
    {
      id: 'time-efficiency',
      title: 'Time Efficiency',
      value: '92%',
      subtitle: 'Optimal time usage',
      change: {
        value: '+5%',
        trend: 'up',
        period: 'this month'
      },
      progress: {
        value: 92,
        max: 100,
      },
      status: {
        label: 'Excellent',
        variant: 'default'
      },
      icon: Clock,
      sparklineData: [88, 89, 87, 91, 90, 92, 92]
    },
    {
      id: 'team-collaboration',
      title: 'Team Collaboration',
      value: '87%',
      subtitle: 'Team interaction score',
      change: {
        value: '+12%',
        trend: 'up',
        period: 'vs last quarter'
      },
      status: {
        label: 'Strong',
        variant: 'default'
      },
      icon: Users,
      actionable: true,
      onClick: () => navigate('/dashboard/team')
    }
  ], [metrics, personalTasks.length, navigate]);

  // Data visualization data
  const taskStatusData = useMemo(() => [
    { label: 'Completed', value: metrics.completedTasks.length, color: 'hsl(var(--success))' },
    { label: 'In Progress', value: metrics.inProgressTasks.length, color: 'hsl(var(--primary))' },
    { label: 'To Do', value: personalTasks.filter(t => t.status === 'To Do').length, color: 'hsl(var(--muted-foreground))' },
    { label: 'Overdue', value: metrics.overdueTasks.length, color: 'hsl(var(--destructive))' }
  ], [metrics, personalTasks]);

  const projectStatusData = useMemo(() => [
    { label: 'Active', value: metrics.activeProjects.length, color: 'hsl(var(--primary))' },
    { label: 'Completed', value: projects.filter(p => p.isCompleted).length, color: 'hsl(var(--success))' }
  ], [metrics.activeProjects.length, projects]);

  // Handlers
  const handleCreateTask = useCallback((project?: Project) => {
    setEditingTask(undefined);
    setSelectedProject(project || null);
    setIsCreateTaskOpen(true);
  }, []);

  const handleTaskDialogComplete = useCallback(() => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
    setSelectedProject(null);
  }, []);

  return (
    <PullToRefresh onRefresh={async () => {}}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
        <div className="relative px-4 md:px-6 lg:px-8 py-6 space-y-8">
          {/* Executive Summary Header */}
          <div className="animate-fade-in">
            <ExecutiveSummaryHeader
              userName={user?.name || 'Executive'}
              timeGreeting={timeGreeting}
              primaryMetrics={primaryMetrics}
              onCreateTask={() => handleCreateTask()}
              isLoading={tasksLoading || projectsLoading}
            />
          </div>

          {/* Executive Metrics Grid */}
          <div className="animate-fade-in delay-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {executiveMetrics.map((metric) => (
                <ExecutiveMetricCard
                  key={metric.id}
                  data={metric}
                  variant="default"
                />
              ))}
            </div>
          </div>

          {/* Data Visualization Section */}
          <div className="animate-fade-in delay-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Task Distribution */}
              <DataVisualizationCard
                title="Task Distribution"
                subtitle="Current workload breakdown"
                data={taskStatusData}
                type="pie"
                icon={PieChart}
                interactive
                onClick={() => navigate('/dashboard/tasks')}
              />

              {/* Project Status */}
              <DataVisualizationCard
                title="Project Status"
                subtitle="Active vs completed projects"
                data={projectStatusData}
                type="ring"
                icon={BarChart3}
                interactive
                onClick={() => navigate('/dashboard/projects')}
              />

              {/* Quick Actions Card */}
              <Card className="executive-card hover-lift">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Filter className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Quick Actions</h3>
                      <p className="text-xs text-muted-foreground">
                        Streamline your workflow
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-between hover-lift"
                      onClick={() => navigate('/dashboard/tasks')}
                    >
                      <span>View All Tasks</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-between hover-lift"
                      onClick={() => navigate('/dashboard/projects')}
                    >
                      <span>Manage Projects</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    {user?.role === 'manager' && (
                      <Button
                        variant="outline"
                        className="w-full justify-between hover-lift"
                        onClick={() => navigate('/dashboard/team')}
                      >
                        <span>Team Overview</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full justify-between hover-lift"
                      onClick={() => navigate('/dashboard/reports')}
                    >
                      <span>View Reports</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Executive Insights */}
          {metrics.overdueTasks.length > 0 && (
            <div className="animate-fade-in delay-300">
              <Card className="executive-card border-l-4 border-l-destructive">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">
                        Action Required: Overdue Tasks
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        You have {metrics.overdueTasks.length} overdue {metrics.overdueTasks.length === 1 ? 'task' : 'tasks'} that need immediate attention to maintain productivity.
                      </p>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => navigate('/dashboard/tasks?filter=overdue')}
                      >
                        Review Overdue Tasks
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Task Creation Dialog */}
          <EnhancedCreateTaskDialog 
            open={isCreateTaskOpen} 
            onOpenChange={setIsCreateTaskOpen}
            editingTask={editingTask}
            currentProjectId={selectedProject?.id}
            onTaskComplete={handleTaskDialogComplete}
            createTask={createTask}
            updateTask={updateTask}
          />
        </div>
      </div>
    </PullToRefresh>
  );
};

export default ProfessionalDashboard;