
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { usePersonalTasks } from '@/hooks/usePersonalTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import CreateTaskDialogEnhanced from '@/components/CreateTaskDialogEnhanced';
import { format } from 'date-fns';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import UpcomingTasksSection from '@/components/dashboard/UpcomingTasksSection';
import RecentProjects from '@/components/dashboard/RecentProjects';
import TeamManagement from '@/components/dashboard/TeamManagement';
import { useIsMobile } from '@/hooks/use-mobile';
import TimeTracking from '@/components/dashboard/TimeTracking';
import { useTask } from '@/contexts/task';
import EnhancedDashboardHeader from '@/components/dashboard/EnhancedDashboardHeader';
import InteractiveStatsGrid from '@/components/dashboard/InteractiveStatsGrid';
import ModernSectionCard from '@/components/dashboard/ModernSectionCard';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';
import { Clock, FileText, Users, Target } from 'lucide-react';

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
      <div className="relative pt-6 px-4 md:px-6 lg:px-8 space-y-8 no-scrollbar">
        {/* Enhanced Welcome Header with proper spacing */}
        <div className="animate-fade-in">
          <EnhancedDashboardHeader
            userName={user?.name || 'User'}
            onCreateTask={() => handleCreateTask()}
            isLoading={isLoading}
            stats={headerStats}
          />
        </div>
        
        {/* Interactive Stats Grid */}
        <div className="animate-fade-in delay-100">
          <InteractiveStatsGrid 
            dailyScore={dailyScore.percentage}
            todaysTasks={todaysTasks}
            upcomingTasks={upcomingTasks}
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="animate-fade-in delay-200">
          <ModernSectionCard
            title="Quick Actions"
            subtitle="Fast access to common tasks"
            icon={Target}
            noPadding
          >
            <div className="p-6">
              <QuickActionsPanel
                onCreateTask={() => handleCreateTask()}
                userRole={user?.role || 'user'}
              />
            </div>
          </ModernSectionCard>
        </div>

        {/* Time Tracking Section */}
        <div className="animate-fade-in delay-300">
          <ModernSectionCard
            title="Time Tracking"
            subtitle="Track your work hours and view today's activity"
            icon={Clock}
            noPadding
          >
            <div className="p-4">
              <TimeTracking />
            </div>
          </ModernSectionCard>
        </div>
        
        {/* Tasks Sections with improved spacing */}
        <div className="space-y-8 animate-fade-in delay-400">
          <ModernSectionCard
            title="Today's Focus"
            subtitle="Tasks scheduled for today"
            icon={Target}
            noPadding
          >
            <div className="p-1">
              <DailyTasksSection 
                tasks={todaysTasks}
                onCreateTask={() => handleCreateTask()}
                onEditTask={handleEditTask}
              />
            </div>
          </ModernSectionCard>
          
          <ModernSectionCard
            title="Upcoming Work"
            subtitle="Tasks coming up this week"
            icon={Calendar}
            noPadding
          >
            <div className="p-1">
              <UpcomingTasksSection 
                tasks={upcomingTasks}
                onCreateTask={() => handleCreateTask()}
                onEditTask={handleEditTask}
              />
            </div>
          </ModernSectionCard>
        </div>
        
        {/* Manager-only sections */}
        {user?.role === 'manager' && (
          <div className="space-y-8 animate-fade-in delay-500">
            <ModernSectionCard
              title="Active Projects"
              subtitle="Your recent projects and progress"
              icon={FileText}
              noPadding
            >
              <div className="p-1">
                <RecentProjects 
                  projects={recentProjects}
                  onViewTasks={handleViewTasks}
                  onCreateTask={handleCreateTaskForProject}
                  onRefresh={refreshProjects}
                />
              </div>
            </ModernSectionCard>
            
            <ModernSectionCard
              title="Team Management"
              subtitle="Manage your team and assignments"
              icon={Users}
            >
              <TeamManagement />
            </ModernSectionCard>
          </div>
        )}
        
        {/* Add bottom padding for proper spacing */}
        <div className="pb-8" />
        
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
