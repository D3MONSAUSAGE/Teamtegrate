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
import FloatingActionButton from '@/components/mobile/FloatingActionButton';
import SkeletonCard from '@/components/mobile/SkeletonCard';
import { toast } from 'sonner';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { motion } from 'framer-motion';

// Enhanced mobile components
import NativeMobileHeader from '@/components/mobile/NativeMobileHeader';
import StatsHeroSection from '@/components/mobile/StatsHeroSection';
import NativeTaskSection from '@/components/mobile/NativeTaskSection';
import NativeMobileTimeTracking from '@/components/mobile/NativeMobileTimeTracking';

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
          // Enhanced Mobile Layout
          <div className="flex flex-col min-h-screen">
            {/* Enhanced Native Header */}
            <div className="flex-none">
              <NativeMobileHeader
                userName={user?.name || 'User'}
                onCreateTask={() => handleCreateTask()}
                isLoading={isLoading}
                dailyScore={personalDailyScore.percentage}
              />
            </div>
            
            {/* Enhanced Stats Hero Section */}
            <div className="flex-none">
              <StatsHeroSection 
                dailyScore={personalDailyScore.percentage}
                todaysTasks={todaysTasks}
                upcomingTasks={upcomingTasks}
                overdueTasks={overdueTasks}
              />
            </div>

            {/* Scrollable Content with Native Task Sections */}
            <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
              <div className="space-y-6">
                {/* Today's Tasks */}
                <NativeTaskSection
                  title="Today's Focus"
                  tasks={todaysTasks}
                  icon={Target}
                  onCreateTask={() => handleCreateTask()}
                  onEditTask={handleEditTask}
                  onStatusChange={onStatusChange}
                  emptyMessage="No tasks for today"
                  emptyDescription="Perfect time to plan your day ahead!"
                  gradient="from-blue-500 to-purple-600"
                  maxVisible={3}
                />

                {/* Upcoming Tasks */}
                <NativeTaskSection
                  title="This Week"
                  tasks={upcomingTasks}
                  icon={Calendar}
                  onCreateTask={() => handleCreateTask()}
                  onEditTask={handleEditTask}
                  onStatusChange={onStatusChange}
                  emptyMessage="All caught up!"
                  emptyDescription="No upcoming tasks this week"
                  gradient="from-green-500 to-teal-600"
                  maxVisible={2}
                />

                {/* Overdue Tasks - Only show if there are any */}
                {overdueTasks.length > 0 && (
                  <NativeTaskSection
                    title="Needs Attention"
                    tasks={overdueTasks}
                    icon={AlertTriangle}
                    onCreateTask={() => handleCreateTask()}
                    onEditTask={handleEditTask}
                    onStatusChange={onStatusChange}
                    emptyMessage="Nothing overdue!"
                    emptyDescription="Great job staying on top of things"
                    gradient="from-red-500 to-orange-600"
                    maxVisible={2}
                  />
                )}

                {/* Enhanced Time Tracking */}
                <NativeMobileTimeTracking />

                {/* Manager-only sections with native design */}
                {user?.role === 'manager' && (
                  <>
                    <div className="px-4 py-2">
                      <motion.div 
                        className="flex items-center gap-3 mb-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-foreground">Active Projects</h2>
                          <p className="text-xs text-muted-foreground">{recentProjects.length} projects</p>
                        </div>
                      </motion.div>
                      <div className="bg-card rounded-2xl p-4 shadow-lg border border-border/50">
                        <RecentProjects 
                          projects={recentProjects}
                          onViewTasks={handleViewTasks}
                          onCreateTask={handleCreateTaskForProject}
                          onRefresh={refreshProjects}
                        />
                      </div>
                    </div>

                    <div className="px-4 py-2">
                      <motion.div 
                        className="flex items-center gap-3 mb-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-foreground">Team</h2>
                          <p className="text-xs text-muted-foreground">Manage your team</p>
                        </div>
                      </motion.div>
                      <div className="bg-card rounded-2xl p-4 shadow-lg border border-border/50">
                        <TeamManagement />
                      </div>
                    </div>
                  </>
                )}

                {/* Add some bottom spacing */}
                <div className="h-8" />
              </div>
            </div>

            {/* Fixed Bottom Navigation */}
            <MobileBottomNav />

            {/* Enhanced Floating Action Button */}
            <FloatingActionButton
              onCreateTask={() => handleCreateTask()}
              onStartTimer={() => {}}
            />
          </div>
        ) : (
          // Desktop Layout
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
      </div>
    </PullToRefresh>
  );
};

export default DashboardPage;
