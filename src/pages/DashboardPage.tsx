
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import TimeTrackingErrorBoundary from '@/components/dashboard/time/TimeTrackingErrorBoundary';

// Shared components for both mobile and desktop
import EnhancedDashboardHeader from '@/components/dashboard/EnhancedDashboardHeader';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import RecentProjects from '@/components/dashboard/RecentProjects';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';

// Preserved components
import FloatingTimeTracker from '@/components/dashboard/FloatingTimeTracker';

// Dialogs
import CreateTaskDialog from '@/components/dialogs/CreateTaskDialog';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';
import { isTaskOverdue } from '@/utils/taskUtils';

const DashboardPage = () => {
  const { user, isReady, profileLoading } = useAuth();
  const { tasks, projects, dailyScore } = useTask();
  const isMobile = useIsMobile();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleCreateTask = () => {
    if (!isReady) {
      console.log('DashboardPage: User not ready for task creation');
      return;
    }
    console.log('DashboardPage: Opening create task dialog');
    setEditingTask(null);
    setIsCreateTaskOpen(true);
  };

  const handleCreateProject = () => {
    if (!isReady) {
      console.log('DashboardPage: User not ready for project creation');
      return;
    }
    console.log('DashboardPage: Opening create project dialog');
    setIsCreateProjectOpen(true);
  };

  const handleTaskSubmit = async (taskData: any) => {
    console.log('DashboardPage: Task submitted:', taskData);
  };

  const handleTaskClick = (task: Task) => {
    console.log('DashboardPage: Task clicked:', task.title);
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskDetailOpen(false);
    setIsCreateTaskOpen(true);
  };

  const handleTaskDetailClose = () => {
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
  };

  const handleProjectCreated = () => {
    console.log('DashboardPage: Project created successfully');
  };

  if (!user) return null;

  // Show loading state if user is not ready
  if (!user || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate stats for the dashboard
  const todaysTasks = tasks.filter(task => {
    const today = new Date();
    const taskDate = new Date(task.deadline);
    return taskDate.toDateString() === today.toDateString();
  });

  const upcomingTasks = tasks.filter(task => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const taskDate = new Date(task.deadline);
    return taskDate > new Date() && taskDate <= tomorrow;
  });

  const overdueTasks = tasks.filter(task => isTaskOverdue(task));

  const stats = {
    todaysCount: todaysTasks.length,
    upcomingCount: upcomingTasks.length,
    projectsCount: projects.length
  };

  // Unified colorful layout for both mobile and desktop
  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-purple-50/30 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20"
      >
        <div className="space-y-8 p-6">
          {/* Colorful Header - Same for both mobile and desktop */}
          <EnhancedDashboardHeader
            userName={user?.name?.split(' ')[0] || 'User'}
            onCreateTask={handleCreateTask}
            isLoading={false}
            stats={stats}
          />
          
          {/* Main Dashboard Grid - App-like layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Tasks (2/3 width on desktop) */}
            <div className="xl:col-span-2 space-y-8">
              <ErrorBoundary>
                <DailyTasksSection 
                  tasks={tasks} 
                  onCreateTask={handleCreateTask}
                  onTaskClick={handleTaskClick}
                />
              </ErrorBoundary>
              
              <ErrorBoundary>
                <RecentProjects projects={projects} />
              </ErrorBoundary>
            </div>
            
            {/* Right Column - Quick Actions (1/3 width on desktop) */}
            <div className="xl:col-span-1 space-y-8">
              <ErrorBoundary>
                <QuickActionsPanel onCreateTask={handleCreateTask} />
              </ErrorBoundary>
            </div>
          </div>

          {/* Preserved: Floating Time Tracker */}
          <TimeTrackingErrorBoundary>
            <FloatingTimeTracker />
          </TimeTrackingErrorBoundary>
        </div>

        {/* Dialogs */}
        <CreateTaskDialog
          open={isCreateTaskOpen}
          onOpenChange={setIsCreateTaskOpen}
          onSubmit={handleTaskSubmit}
          editingTask={editingTask}
        />

        <CreateProjectDialog
          open={isCreateProjectOpen}
          onOpenChange={setIsCreateProjectOpen}
          onProjectCreated={handleProjectCreated}
        />

        <TaskDetailDialog
          open={isTaskDetailOpen}
          onOpenChange={handleTaskDetailClose}
          task={selectedTask}
          onEdit={handleEditTask}
        />
      </motion.div>
    </ErrorBoundary>
  );
};

export default DashboardPage;
