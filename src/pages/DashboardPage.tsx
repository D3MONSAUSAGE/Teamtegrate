import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { usePersonalTasks } from '@/hooks/usePersonalTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { Task, Project } from '@/types';
import { Plus, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTask } from '@/contexts/task';
import ModernPageHeader from '@/components/ui/ModernPageHeader';
import CompactDashboardLayout from '@/components/dashboard/compact/CompactDashboardLayout';
import { Clock, FileText, Users, Target, AlertTriangle } from 'lucide-react';
import { isTaskOverdue } from '@/utils/taskUtils';
import { calculateDailyScore } from '@/contexts/task/taskMetrics';
import { useTaskRealtime } from '@/hooks/useTaskRealtime';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import SwipeableTaskCard from '@/components/mobile/SwipeableTaskCard';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';
import SkeletonCard from '@/components/mobile/SkeletonCard';
import { toast } from 'sonner';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Add real-time subscription for immediate updates
  useTaskRealtime();
  
  // Use personal tasks hook for refined personal task filtering
  const { tasks: personalTasks, isLoading: tasksLoading, error: tasksError } = usePersonalTasks();
  const { projects, isLoading: projectsLoading, refreshProjects, error: projectsError } = useProjects();
  
  // Get task context for status updates
  const { updateTaskStatus, createTask, updateTask } = useTask();
  
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Use personal tasks for dashboard display
  const tasks = personalTasks;
  
  // Combined loading state
  const isLoading = tasksLoading || projectsLoading;
  
  // Calculate personal daily score using only the user's tasks
  const personalDailyScore = useMemo(() => {
    return calculateDailyScore(tasks);
  }, [tasks]);
  
  // Memoize expensive calculations to prevent re-computation on every render
  const { todaysTasks, upcomingTasks, overdueTasks, flatProjects, recentProjects } = useMemo(() => {
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

    const overdueTasks = tasks.filter((task) => isTaskOverdue(task));
    
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
    
    return { todaysTasks, upcomingTasks, overdueTasks, flatProjects, recentProjects };
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
    navigate(`/dashboard/projects/${project.id}/tasks`);
  }, [navigate]);

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
  
  // Enhanced refresh handler with better UX
  const handlePullToRefresh = useCallback(async () => {
    try {
      await refreshProjects();
      // Add a small delay for better UX feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Pull to refresh failed:', error);
    }
  }, [refreshProjects]);

  // Fixed task status change handler
  const onStatusChange = async (taskId: string, status: string): Promise<void> => {
    try {
      setIsUpdatingStatus(taskId);
      console.log(`Changing task ${taskId} status to ${status}`);
      
      // Validate status
      const validStatuses = ['To Do', 'In Progress', 'Completed'];
      if (!validStatuses.includes(status)) {
        toast.error('Invalid status selected');
        return;
      }

      // Update task status using the task context
      await updateTaskStatus(taskId, status as Task['status']);
      
      toast.success(`Task status updated to ${status}`);
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status. Please try again.');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} variant="task" />
        ))}
      </div>
    </div>
  );

  return (
    <PullToRefresh onRefresh={handlePullToRefresh}>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background scrollbar-hide">
        <div className="relative pt-4 px-4 md:px-6 lg:px-8 space-y-6 scrollbar-hide">
          {/* Compact Welcome Header */}
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Welcome back, {user?.name || 'User'}! 👋
                </h1>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')} • Stay productive today
                </p>
              </div>
              <Button 
                onClick={() => handleCreateTask()}
                disabled={isLoading}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>
          
          {/* Compact Dashboard Layout */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div>Debug: user role = {user?.role || 'undefined'}</div>
              <CompactDashboardLayout
                dailyScore={personalDailyScore.percentage}
                tasks={tasks}
                projects={flatProjects}
                userRole={user?.role || 'user'}
                onCreateTask={() => handleCreateTask()}
                onEditTask={handleEditTask}
                onCreateProject={user?.role === 'manager' ? () => {
                  // Navigate to projects page to create
                  navigate('/dashboard/projects');
                } : undefined}
              />
            </>
          )}
          
          {/* Add bottom padding for FAB */}
          <div className="pb-20 md:pb-8" />
          
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

        {/* Floating Action Button - Mobile Only */}
        {isMobile && (
          <FloatingActionButton
            onCreateTask={() => handleCreateTask()}
            onStartTimer={() => {}}
          />
        )}
      </div>
    </PullToRefresh>
  );
};

export default DashboardPage;
