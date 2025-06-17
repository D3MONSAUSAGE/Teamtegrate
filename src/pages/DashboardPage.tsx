import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useTask } from '@/contexts/task';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import CreateTaskDialogEnhanced from '@/components/CreateTaskDialogEnhanced';
import { format } from 'date-fns';
import TasksSummary from '@/components/dashboard/TasksSummary';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import UpcomingTasksSection from '@/components/dashboard/UpcomingTasksSection';
import RecentProjects from '@/components/dashboard/RecentProjects';
import TeamManagement from '@/components/dashboard/TeamManagement';
import { useIsMobile } from '@/hooks/use-mobile';
import AnalyticsSection from '@/components/dashboard/AnalyticsSection';
import TimeTracking from '@/components/dashboard/TimeTracking';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';
import { useTasksPageData } from '@/hooks/useTasksPageData';

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

  const handleViewTasks = useCallback((project: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("View tasks for project:", project.title);
    }
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
      <div className="relative space-y-8 no-scrollbar">
        {/* Connection Status Alert */}
        <ConnectionStatus 
          lastError={lastError}
          onRetry={handleManualRefresh}
          isLoading={isLoading}
        />

        {/* Simplified Welcome Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-emerald-500/3 to-primary/3" />
          
          <div className="relative bg-card/80 backdrop-blur-sm border shadow-lg rounded-2xl p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-emerald-600 bg-clip-text text-transparent">
                    Welcome back, {user?.name}!
                  </h1>
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex items-center gap-4 text-base">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
                  </div>
                  <div className="hidden sm:block w-px h-4 bg-border" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Your productivity overview</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-6 pt-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{headerStats.todaysCount}</div>
                    <div className="text-xs text-muted-foreground">Today's Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">{headerStats.upcomingCount}</div>
                    <div className="text-xs text-muted-foreground">Upcoming</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-600">{headerStats.projectsCount}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => handleCreateTask()} 
                size={isMobile ? "default" : "lg"} 
                className="bg-gradient-to-r from-primary to-emerald-500 hover:shadow-lg transition-all duration-200"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" /> 
                Create Task
              </Button>
            </div>
          </div>
        </div>
        
        {/* Enhanced Quick Stats Summary */}
        <div className="animate-fade-in">
          <TasksSummary 
            dailyScore={dailyScore}
            todaysTasks={todaysTasks}
            upcomingTasks={upcomingTasks}
          />
        </div>

        {/* Time Tracking Section - Simplified */}
        <div className="bg-card/70 backdrop-blur-sm border rounded-2xl">
          <div className="p-4 border-b border-border/50">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Quick Time Tracking
            </h2>
          </div>
          <div className="p-4">
            <TimeTracking />
          </div>
        </div>

        {/* Analytics Overview - Keep existing */}
        <div className="bg-card/70 backdrop-blur-sm border rounded-2xl">
          <div className="p-4 border-b border-border/50">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Analytics & Insights
            </h2>
          </div>
          <div className="p-4">
            <AnalyticsSection />
          </div>
        </div>
        
        {/* Tasks Sections - Keep existing */}
        <div className="space-y-6">
          <div className="bg-card/70 backdrop-blur-sm border rounded-2xl p-4">
            <DailyTasksSection 
              tasks={todaysTasks}
              onCreateTask={() => handleCreateTask()}
              onEditTask={handleEditTask}
            />
          </div>
          
          <div className="bg-card/70 backdrop-blur-sm border rounded-2xl p-4">
            <UpcomingTasksSection 
              tasks={upcomingTasks}
              onCreateTask={() => handleCreateTask()}
              onEditTask={handleEditTask}
            />
          </div>
        </div>
        
        {/* Manager-only sections - Keep existing */}
        {user?.role === 'manager' && (
          <div className="space-y-6">
            <div className="bg-card/70 backdrop-blur-sm border rounded-2xl p-4">
              <RecentProjects 
                projects={recentProjects}
                onViewTasks={handleViewTasks}
                onCreateTask={handleCreateTaskForProject}
                onRefresh={refreshProjects}
              />
            </div>
            
            <div className="bg-card/70 backdrop-blur-sm border rounded-2xl">
              <TeamManagement />
            </div>
          </div>
        )}
        
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
