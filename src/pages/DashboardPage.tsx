import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useTask } from '@/contexts/task';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import CreateTaskDialogEnhanced from '@/components/CreateTaskDialogEnhanced';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';
import { useTasksPageData } from '@/hooks/useTasksPageData';

// Compact Components
import CompactTimeTracking from '@/components/dashboard/CompactTimeTracking';
import CompactTasksSummary from '@/components/dashboard/CompactTasksSummary';
import CompactTasksWidget from '@/components/dashboard/CompactTasksWidget';
import CompactAnalytics from '@/components/dashboard/CompactAnalytics';
import CompactProjects from '@/components/dashboard/CompactProjects';
import TeamManagement from '@/components/dashboard/TeamManagement';

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks: contextTasks, dailyScore } = useTask();
  const { tasks: hookTasks, isLoading: tasksLoading, error: tasksError } = useTasksPageData();
  const { projects, isLoading: projectsLoading, refreshProjects, error: projectsError } = useProjects();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const isMobile = useIsMobile();
  
  // Use hook tasks if available and context tasks as fallback
  const tasks = hookTasks.length > 0 ? hookTasks : contextTasks;
  
  // Combined loading state
  const isLoading = tasksLoading || projectsLoading;
  
  // Combined error state
  const lastError = tasksError?.message || projectsError || null;
  
  // Get numeric daily score - handle both number and object types
  const numericDailyScore = typeof dailyScore === 'number' 
    ? dailyScore 
    : typeof dailyScore === 'object' && dailyScore !== null && 'value' in dailyScore
    ? (dailyScore as any).value
    : 75; // Default fallback
  
  // Memoize expensive calculations to prevent re-computation on every render
  const { todaysTasks, upcomingTasks, flatProjects, recentProjects } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const todaysTasks = tasks.filter((task) => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    const upcomingTasks = tasks.filter((task) => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate > today && taskDate <= nextWeek;
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    
    const flatProjects = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      managerId: project.managerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      teamMemberIds: project.teamMemberIds || [],
      budget: project.budget,
      budgetSpent: project.budgetSpent || 0,
      isCompleted: project.isCompleted,
      status: project.status,
      tasksCount: project.tasksCount,
      tags: project.tags || [],
      organizationId: project.organizationId || user?.organizationId || ''
    }));
    
    const recentProjects = flatProjects.slice(0, 3);
    
    return { todaysTasks, upcomingTasks, flatProjects, recentProjects };
  }, [tasks, projects, user?.organizationId]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    try {
      await refreshProjects();
      // Force refetch of tasks through context
      if (window.location) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  }, [refreshProjects]);

  // Debounced click handlers to prevent rapid clicking issues
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, []);

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

  const handleCreateTaskForProject = useCallback((project: any) => {
    const convertedProject: Project = {
      id: project.id,
      title: project.title,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      managerId: project.managerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      teamMemberIds: project.teamMemberIds,
      budget: project.budget,
      budgetSpent: project.budgetSpent,
      isCompleted: project.isCompleted,
      status: project.status,
      tasksCount: project.tasksCount,
      tags: project.tags,
      organizationId: project.organizationId
    };
    handleCreateTask(convertedProject);
  }, [handleCreateTask]);

  // Memoized stats for header
  const headerStats = useMemo(() => ({
    todaysCount: todaysTasks.length,
    upcomingCount: upcomingTasks.length,
    projectsCount: isLoading ? '...' : flatProjects.length
  }), [todaysTasks.length, upcomingTasks.length, isLoading, flatProjects.length]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
      <div className="relative space-y-8 no-scrollbar p-4 md:p-6">
        {/* Connection Status Alert */}
        <ConnectionStatus 
          lastError={lastError}
          onRetry={handleManualRefresh}
          isLoading={isLoading}
        />

        {/* Enhanced Welcome Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-emerald-500/3 to-primary/3" />
          
          <div className="relative bg-card/80 backdrop-blur-sm border shadow-lg rounded-2xl p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-emerald-600 bg-clip-text text-transparent">
                    Welcome back, {user?.name}!
                  </h1>
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex items-center gap-4 text-base">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
                  </div>
                  <div className="hidden sm:block w-px h-5 bg-border" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-5 w-5" />
                    <span>Your productivity dashboard</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-8 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{headerStats.todaysCount}</div>
                    <div className="text-sm text-muted-foreground">Today's Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{headerStats.upcomingCount}</div>
                    <div className="text-sm text-muted-foreground">Upcoming</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{headerStats.projectsCount}</div>
                    <div className="text-sm text-muted-foreground">Projects</div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => handleCreateTask()} 
                size="lg" 
                className="bg-gradient-to-r from-primary to-emerald-500 hover:shadow-lg transition-all duration-200 h-12 px-6 text-base"
                disabled={isLoading}
              >
                <Plus className="h-5 w-5 mr-2" /> 
                Create Task
              </Button>
            </div>
          </div>
        </div>
        
        {/* Improved Grid Layout with Better Spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <CompactTasksSummary 
              dailyScore={numericDailyScore}
              todaysTasks={todaysTasks}
              upcomingTasks={upcomingTasks}
            />
            <CompactTimeTracking />
          </div>

          {/* Center Column */}
          <div className="space-y-6">
            <CompactTasksWidget 
              todaysTasks={todaysTasks}
              upcomingTasks={upcomingTasks}
              onCreateTask={() => handleCreateTask()}
              onEditTask={handleEditTask}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <CompactAnalytics />
            {user?.role === 'manager' && (
              <>
                <CompactProjects 
                  projects={recentProjects}
                  onCreateTask={handleCreateTaskForProject}
                  onRefresh={refreshProjects}
                />
                <div className="bg-card/70 backdrop-blur-sm border rounded-2xl shadow-lg">
                  <TeamManagement />
                </div>
              </>
            )}
          </div>
        </div>
        
        <CreateTaskDialogEnhanced 
          open={isCreateTaskOpen} 
          onOpenChange={setIsCreateTaskOpen}
          editingTask={editingTask}
          currentProjectId={selectedProject?.id}
          onTaskComplete={handleTaskDialogComplete}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
