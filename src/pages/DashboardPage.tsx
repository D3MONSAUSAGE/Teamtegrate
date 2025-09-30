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
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import UpcomingTasksStandalone from '@/components/dashboard/UpcomingTasksStandalone';
import OverdueTasksStandalone from '@/components/dashboard/OverdueTasksStandalone';
import RecentProjects from '@/components/dashboard/RecentProjects';
import TeamManagement from '@/components/dashboard/TeamManagement';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedTimeTracking from '@/components/dashboard/EnhancedTimeTracking';
import { useTask } from '@/contexts/task';
import ModernPageHeader from '@/components/ui/ModernPageHeader';
import InteractiveStatsGrid from '@/components/dashboard/InteractiveStatsGrid';
import ModernSectionCard from '@/components/dashboard/ModernSectionCard';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';
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
  
  // Get task context for status updates - with error handling
  let updateTaskStatus: any, createTask: any, updateTask: any;
  try {
    const taskContext = useTask();
    updateTaskStatus = taskContext.updateTaskStatus;
    createTask = taskContext.createTask;
    updateTask = taskContext.updateTask;
  } catch (error) {
    console.warn('TaskProvider not available, disabling task operations');
    updateTaskStatus = undefined;
    createTask = undefined;
    updateTask = undefined;
  }
  
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

    const overdueTasks = tasks.filter((task) => {
      // Basic validation
      if (!task || !task.deadline) return false;
      
      // Check if deadline has passed
      const now = new Date();
      const deadline = new Date(task.deadline);
      if (deadline >= now) return false;
      
      // Case-insensitive status check
      const status = task.status?.toLowerCase();
      
      // Explicitly exclude completed and archived
      if (status === 'completed' || status === 'archived') return false;
      
      // Double-check with isTaskOverdue for consistency
      return isTaskOverdue(task);
    });
    
    // Temporary debugging - can be removed after fix is verified
    console.log('=== OVERDUE TASKS DIAGNOSTIC ===');
    console.log('Total tasks loaded:', tasks.length);
    console.log('Filtered overdue count:', overdueTasks.length);
    console.log('Status breakdown:', {
      completed: tasks.filter(t => t.status?.toLowerCase() === 'completed').length,
      'in progress': tasks.filter(t => t.status?.toLowerCase() === 'in progress').length,
      'to do': tasks.filter(t => t.status?.toLowerCase() === 'to do').length,
      archived: tasks.filter(t => t.status?.toLowerCase() === 'archived').length,
      other: tasks.filter(t => {
        const s = t.status?.toLowerCase();
        return !['completed', 'in progress', 'to do', 'archived'].includes(s);
      }).length
    });
    console.log('Sample of overdue tasks:', overdueTasks.slice(0, 3).map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      deadline: t.deadline,
      assignedTo: t.assignedToNames
    })));
    
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
    if (!updateTaskStatus) {
      toast.error('Task operations are not available. Please refresh the page.');
      return;
    }
    
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
        <div className="relative pt-6 px-4 md:px-6 lg:px-8 space-y-8 scrollbar-hide">
          {/* Enhanced Welcome Header with proper spacing */}
          <div className="animate-fade-in">
            <ModernPageHeader
              title={`Welcome back, ${user?.name || 'User'}!`}
              subtitle="Stay productive today and manage your tasks"
              icon={Sparkles}
              actionButton={{
                label: 'Create New Task',
                onClick: () => handleCreateTask(),
                disabled: isLoading,
                icon: Plus
              }}
              stats={[
                { label: "Today's Tasks", value: headerStats.todaysCount, color: 'text-primary' },
                { label: 'Upcoming', value: headerStats.upcomingCount, color: 'text-emerald-600' },
                { label: 'Projects', value: headerStats.projectsCount, color: 'text-amber-600' }
              ]}
              badges={[
                { label: 'Live Updates', variant: 'default' }
              ]}
            />
          </div>
          
          {/* Quick Actions and Stats Grid - Side by Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Quick Actions Panel - Takes 1/3 on desktop (LEFT) */}
            <div className="lg:col-span-1 animate-fade-in delay-100 flex">
              <ModernSectionCard
                title="Quick Actions"
                subtitle="Fast access to common tasks"
                icon={Target}
                noPadding
                className="w-full"
              >
                <div className="p-6 flex flex-col h-full">
                  <QuickActionsPanel
                    userRole={user?.role || 'user'}
                  />
                </div>
              </ModernSectionCard>
            </div>

            {/* Interactive Stats Grid - Takes 2/3 on desktop (RIGHT) */}
            <div className="lg:col-span-2 animate-fade-in delay-200 flex">
              <div className="w-full">
                <InteractiveStatsGrid 
                  dailyScore={personalDailyScore.percentage}
                  todaysTasks={todaysTasks}
                  upcomingTasks={upcomingTasks}
                  overdueTasks={overdueTasks}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Time Tracking Section */}
          <div className="animate-fade-in delay-300">
            <ModernSectionCard
              title="Time Tracking"
              subtitle="Track your work hours with break management and compliance monitoring"
              icon={Clock}
              noPadding
            >
              <div className="p-6">
                <EnhancedTimeTracking />
              </div>
            </ModernSectionCard>
          </div>
          
          {/* Tasks Sections with enhanced mobile interactions */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-8 animate-fade-in delay-500 stagger-fade-in">
              <ModernSectionCard
                title="Today's Focus"
                subtitle="Tasks scheduled for today"
                icon={Target}
                noPadding
              >
                <div className="p-1">
                  {isMobile ? (
                    <div className="space-y-3">
                      {todaysTasks.map((task) => (
                        <SwipeableTaskCard
                          key={task.id}
                          task={task}
                          onEdit={handleEditTask}
                          onStatusChange={onStatusChange}
                          onDelete={() => {}}
                          onClick={() => {}}
                          isUpdating={isUpdatingStatus === task.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <DailyTasksSection 
                      tasks={todaysTasks}
                      onCreateTask={() => handleCreateTask()}
                      onEditTask={handleEditTask}
                    />
                  )}
                </div>
              </ModernSectionCard>
              
              {/* Upcoming Tasks */}
              <UpcomingTasksStandalone 
                tasks={upcomingTasks}
                onCreateTask={() => handleCreateTask()}
                onEditTask={handleEditTask}
                onStatusChange={onStatusChange}
              />

              {/* Overdue Tasks Section */}
              <OverdueTasksStandalone 
                tasks={overdueTasks}
                onCreateTask={() => handleCreateTask()}
                onEditTask={handleEditTask}
                onStatusChange={onStatusChange}
              />
            </div>
          )}
          
          {/* Manager-only sections */}
          {user?.role === 'manager' && (
            <div className="space-y-8 animate-fade-in delay-600">
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
