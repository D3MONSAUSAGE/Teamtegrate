
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { usePersonalTasks } from '@/hooks/usePersonalTasks';
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
import TimeTracking from '@/components/dashboard/TimeTracking';
import { useTask } from '@/contexts/task';

const DashboardPage = () => {
  const { user } = useAuth();
  const { dailyScore } = useTask();
  
  // Use personal tasks hook for refined personal task filtering
  const { tasks: personalTasks, isLoading: tasksLoading, error: tasksError } = usePersonalTasks();
  const { projects, isLoading: projectsLoading, refreshProjects, error: projectsError } = useProjects();
  
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const isMobile = useIsMobile();
  
  // Use personal tasks for dashboard display
  const tasks = personalTasks;
  
  // Combined loading state
  const isLoading = tasksLoading || projectsLoading;
  
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
      // Force refetch of personal tasks
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
        {/* Enhanced Welcome Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-emerald-500/5 to-primary/5" />
          
          <div className="relative bg-card/90 backdrop-blur-sm border shadow-lg rounded-2xl p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-emerald-600 bg-clip-text text-transparent">
                    Welcome back, {user?.name}!
                  </h1>
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>
                
                <div className="flex items-center gap-4 text-lg">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
                  </div>
                  <div className="hidden sm:block w-px h-5 bg-border" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-5 w-5" />
                    <span>Stay focused and productive</span>
                  </div>
                </div>

                {/* Enhanced Quick Stats */}
                <div className="flex items-center gap-8 pt-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{headerStats.todaysCount}</div>
                    <div className="text-sm text-muted-foreground">Tasks Today</div>
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
                size={isMobile ? "default" : "lg"} 
                className="bg-gradient-to-r from-primary to-emerald-500 hover:shadow-lg transition-all duration-200 shadow-md"
                disabled={isLoading}
              >
                <Plus className="h-5 w-5 mr-2" /> 
                Create New Task
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

        {/* Simplified Time Tracking Section */}
        <div className="bg-card/80 backdrop-blur-sm border rounded-xl shadow-sm">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Time Tracking
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Track your work hours and stay productive</p>
          </div>
          <div className="p-6">
            <TimeTracking />
          </div>
        </div>
        
        {/* Tasks Sections with improved styling */}
        <div className="space-y-6">
          <div className="bg-card/80 backdrop-blur-sm border rounded-xl shadow-sm">
            <div className="p-1">
              <DailyTasksSection 
                tasks={todaysTasks}
                onCreateTask={() => handleCreateTask()}
                onEditTask={handleEditTask}
              />
            </div>
          </div>
          
          <div className="bg-card/80 backdrop-blur-sm border rounded-xl shadow-sm">
            <div className="p-1">
              <UpcomingTasksSection 
                tasks={upcomingTasks}
                onCreateTask={() => handleCreateTask()}
                onEditTask={handleEditTask}
              />
            </div>
          </div>
        </div>
        
        {/* Manager-only sections with improved styling */}
        {user?.role === 'manager' && (
          <div className="space-y-6">
            <div className="bg-card/80 backdrop-blur-sm border rounded-xl shadow-sm">
              <div className="p-1">
                <RecentProjects 
                  projects={recentProjects}
                  onViewTasks={handleViewTasks}
                  onCreateTask={handleCreateTaskForProject}
                  onRefresh={refreshProjects}
                />
              </div>
            </div>
            
            <div className="bg-card/80 backdrop-blur-sm border rounded-xl shadow-sm">
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
