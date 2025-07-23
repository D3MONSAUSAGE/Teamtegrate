
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import TimeTrackingErrorBoundary from '@/components/dashboard/time/TimeTrackingErrorBoundary';

// New components for the updated design
import CleanDashboardHeader from '@/components/dashboard/CleanDashboardHeader';
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';
import TaskSections from '@/components/dashboard/TaskSections';
import AndroidAppBanner from '@/components/dashboard/AndroidAppBanner';

// Preserved components
import FloatingTimeTracker from '@/components/dashboard/FloatingTimeTracker';

// Dialogs
import CreateTaskDialog from '@/components/dialogs/CreateTaskDialog';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';

const DashboardPage = () => {
  const { user, isReady } = useAuth();
  const { tasks, projects, dailyScore, updateTaskStatus } = useTask();
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

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    await updateTaskStatus(taskId, status);
  };

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

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-purple-50/30 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20"
      >
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Clean Header */}
          <CleanDashboardHeader
            userName={user?.name?.split(' ')[0] || 'User'}
            onCreateTask={handleCreateTask}
          />
          
          {/* Stats Cards */}
          <DashboardStatsCards
            tasks={tasks}
            dailyScore={dailyScore}
          />
          
          {/* Quick Actions Panel */}
          <ErrorBoundary>
            <QuickActionsPanel onCreateTask={handleCreateTask} />
          </ErrorBoundary>
          
          {/* Task Sections */}
          <ErrorBoundary>
            <TaskSections
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onEdit={handleEditTask}
              onStatusChange={handleStatusChange}
            />
          </ErrorBoundary>
          
          {/* Android App Banner */}
          <AndroidAppBanner />

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
