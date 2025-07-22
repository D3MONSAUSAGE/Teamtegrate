import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { usePersonalTasks } from '@/hooks/usePersonalTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';
import { format } from 'date-fns';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import UpcomingTasksSection from '@/components/dashboard/UpcomingTasksSection';
import OverdueTasksSection from '@/components/dashboard/OverdueTasksSection';
import RecentProjects from '@/components/dashboard/RecentProjects';
import TeamManagement from '@/components/dashboard/TeamManagement';
import { useIsMobile } from '@/hooks/use-mobile';
import EnhancedTimeTracking from '@/components/dashboard/EnhancedTimeTracking';
import { useTask } from '@/contexts/task';
import EnhancedDashboardHeader from '@/components/dashboard/EnhancedDashboardHeader';
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
import MobileStatusBar from '@/components/mobile/MobileStatusBar';
import CompactMobileHeader from '@/components/mobile/CompactMobileHeader';
import CompactSectionHeader from '@/components/mobile/CompactSectionHeader';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';

const DashboardPage = () => {
  const { user } = useAuth();
  
  // Add real-time subscription for immediate updates
  useTaskRealtime();
  
  // Use personal tasks hook for refined personal task filtering
  const { tasks: personalTasks, isLoading: tasksLoading, error: tasksError } = usePersonalTasks();
  const { projects, isLoading: projectsLoading, refreshProjects, error: projectsError } = useProjects();
  
  // Get task context for status updates
  const { updateTaskStatus } = useTask();
  
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
        {isMobile ? (
          // Mobile Layout
          <div className="pb-20"> {/* Bottom padding for bottom nav */}
            {/* Compact Mobile Header */}
            <CompactMobileHeader
              userName={user?.name || 'User'}
              onCreateTask={() => handleCreateTask()}
              isLoading={isLoading}
            />
            
            {/* Mobile Status Bar */}
            <div className="py-3">
              <MobileStatusBar 
                dailyScore={personalDailyScore.percentage}
                todaysTasks={todaysTasks}
                upcomingTasks={upcomingTasks}
                overdueTasks={overdueTasks}
              />
            </div>

            {/* Compact Task Sections */}
            <div className="space-y-4">
              {/* Today's Tasks */}
              <div>
                <CompactSectionHeader
                  title="Today's Focus"
                  count={todaysTasks.length}
                  icon={Target}
                  onAction={() => handleCreateTask()}
                  viewAllLink="/dashboard/tasks"
                />
                <div className="px-4">
                  {todaysTasks.length > 0 ? (
                    <div className="space-y-2">
                      {todaysTasks.slice(0, 3).map((task) => (
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
                    <div className="text-center py-6 px-4 bg-muted/30 rounded-lg">
                      <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No tasks for today</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCreateTask()}
                        className="mt-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Task
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Tasks */}
              <div>
                <CompactSectionHeader
                  title="This Week"
                  count={upcomingTasks.length}
                  icon={Calendar}
                  onAction={() => handleCreateTask()}
                />
                <div className="px-4">
                  {upcomingTasks.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingTasks.slice(0, 2).map((task) => (
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
                    <div className="text-center py-4 px-4 bg-muted/30 rounded-lg">
                      <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No upcoming tasks</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Overdue Tasks - Only show if there are any */}
              {overdueTasks.length > 0 && (
                <div>
                  <CompactSectionHeader
                    title="Overdue"
                    count={overdueTasks.length}
                    icon={AlertTriangle}
                    onAction={() => handleCreateTask()}
                  />
                  <div className="px-4">
                    <div className="space-y-2">
                      {overdueTasks.slice(0, 2).map((task) => (
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
                  </div>
                </div>
              )}

              {/* Time Tracking - Compact */}
              <div>
                <CompactSectionHeader
                  title="Time Tracking"
                  icon={Clock}
                />
                <div className="px-4">
                  <div className="bg-card rounded-lg p-3">
                    <EnhancedTimeTracking />
                  </div>
                </div>
              </div>

              {/* Manager-only sections - Compact */}
              {user?.role === 'manager' && (
                <>
                  <div>
                    <CompactSectionHeader
                      title="Active Projects"
                      count={recentProjects.length}
                      icon={FileText}
                    />
                    <div className="px-4">
                      <div className="bg-card rounded-lg p-3">
                        <RecentProjects 
                          projects={recentProjects}
                          onViewTasks={handleViewTasks}
                          onCreateTask={handleCreateTaskForProject}
                          onRefresh={refreshProjects}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <CompactSectionHeader
                      title="Team"
                      icon={Users}
                    />
                    <div className="px-4">
                      <div className="bg-card rounded-lg p-3">
                        <TeamManagement />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
          </div>
        ) : (
          // Desktop Layout - Keep existing design
          <div className="relative pt-6 px-4 md:px-6 lg:px-8 space-y-8 scrollbar-hide">
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
                dailyScore={personalDailyScore.percentage}
                todaysTasks={todaysTasks}
                upcomingTasks={upcomingTasks}
                overdueTasks={overdueTasks}
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

                {/* Overdue Tasks Section */}
                <ModernSectionCard
                  title="Overdue Tasks"
                  subtitle="Tasks that need immediate attention"
                  icon={AlertTriangle}
                  noPadding
                >
                  <div className="p-1">
                    <OverdueTasksSection 
                      tasks={overdueTasks}
                      onCreateTask={() => handleCreateTask()}
                      onEditTask={handleEditTask}
                    />
                  </div>
                </ModernSectionCard>
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
          </div>
        )}
        
        <EnhancedCreateTaskDialog 
          open={isCreateTaskOpen} 
          onOpenChange={setIsCreateTaskOpen}
          editingTask={editingTask}
          currentProjectId={selectedProject?.id}
          onTaskComplete={handleTaskDialogComplete}
        />

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
