
import React, { useState } from 'react';
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
import { flatTasksToTasks, flatProjectsToProjects } from '@/utils/typeConversions';

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, dailyScore } = useTask();
  const { projects, isLoading: projectsLoading, refreshProjects } = useProjects();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const isMobile = useIsMobile();
  
  // Convert FlatTasks to Tasks for compatibility
  const convertedTasks = flatTasksToTasks(tasks);
  
  // Convert Projects to FlatProjects for components that expect FlatProject
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
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todaysTasks = convertedTasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingTasks = convertedTasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate > today && taskDate <= nextWeek;
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  
  const recentProjects = flatProjects.slice(0, 3);
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };

  const handleCreateTask = (project?: Project) => {
    setEditingTask(undefined);
    setSelectedProject(project || null);
    setIsCreateTaskOpen(true);
  };

  const handleTaskDialogComplete = () => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
    setSelectedProject(null);
  };

  const handleViewTasks = (project: any) => {
    console.log("View tasks for project:", project.title);
  };

  const handleCreateTaskForProject = (project: any) => {
    // Convert to Project for compatibility
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
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      
      <div className="relative space-y-8 no-scrollbar">
        {/* Enhanced Welcome Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-emerald-500/5 to-primary/5 animate-gradient" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(134,239,172,0.1),transparent_70%)]" />
          
          <div className="relative glass-card border-0 shadow-2xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-card/95 dark:via-card/90 dark:to-card/85 backdrop-blur-xl p-8 md:p-10 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-emerald-600 bg-clip-text text-transparent">
                      Welcome back, {user?.name}!
                    </h1>
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-lg">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
                  </div>
                  <div className="hidden sm:block w-px h-4 bg-border" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-5 w-5" />
                    <span>Your productivity overview</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-6 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{todaysTasks.length}</div>
                    <div className="text-xs text-muted-foreground">Today's Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{upcomingTasks.length}</div>
                    <div className="text-xs text-muted-foreground">Upcoming</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{projectsLoading ? '...' : flatProjects.length}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => handleCreateTask()} 
                  size={isMobile ? "default" : "lg"} 
                  className="group relative overflow-hidden bg-gradient-to-r from-primary via-emerald-500 to-primary bg-size-200 animate-gradient hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" /> 
                  Create Task
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Quick Stats Summary */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <TasksSummary 
            dailyScore={dailyScore}
            todaysTasks={todaysTasks}
            upcomingTasks={upcomingTasks}
          />
        </div>

        {/* Enhanced Time Tracking Section */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card border shadow-xl bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Time Tracking
              </h2>
            </div>
            <div className="p-6">
              <TimeTracking />
            </div>
          </div>
        </div>

        {/* Enhanced Analytics Overview */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="glass-card border shadow-xl bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Analytics & Insights
              </h2>
            </div>
            <div className="p-6">
              <AnalyticsSection />
            </div>
          </div>
        </div>
        
        {/* Enhanced Tasks Sections */}
        <div className="space-y-8">
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="glass-card border shadow-xl bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl p-6">
              <DailyTasksSection 
                tasks={todaysTasks}
                onCreateTask={() => handleCreateTask()}
                onEditTask={handleEditTask}
              />
            </div>
          </div>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="glass-card border shadow-xl bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl p-6">
              <UpcomingTasksSection 
                tasks={upcomingTasks}
                onCreateTask={() => handleCreateTask()}
                onEditTask={handleEditTask}
              />
            </div>
          </div>
        </div>
        
        {/* Enhanced Manager-only sections */}
        {user?.role === 'manager' && (
          <div className="space-y-8">
            <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="glass-card border shadow-xl bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl p-6">
                <RecentProjects 
                  projects={recentProjects}
                  onViewTasks={handleViewTasks}
                  onCreateTask={handleCreateTaskForProject}
                  onRefresh={refreshProjects}
                />
              </div>
            </div>
            
            <div className="animate-slide-up" style={{ animationDelay: '0.7s' }}>
              <div className="glass-card border shadow-xl bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl">
                <TeamManagement />
              </div>
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
