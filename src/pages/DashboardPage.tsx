import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';

// Mobile components (unchanged)
import EnhancedDashboardHeader from '@/components/dashboard/EnhancedDashboardHeader';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import RecentProjects from '@/components/dashboard/RecentProjects';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';

// New premium desktop components
import PremiumDashboardHeader from '@/components/dashboard/PremiumDashboardHeader';
import GlassMorphismStatsGrid from '@/components/dashboard/GlassMorphismStatsGrid';
import FloatingTimeTracker from '@/components/dashboard/FloatingTimeTracker';
import IntelligentTaskVisualization from '@/components/dashboard/IntelligentTaskVisualization';
import InteractiveQuickActions from '@/components/dashboard/InteractiveQuickActions';

// Dialogs
import CreateTaskDialog from '@/components/dialogs/CreateTaskDialog';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';
import { isTaskOverdue } from '@/utils/taskUtils';

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, projects, dailyScore } = useTask();
  const isMobile = useIsMobile();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleCreateTask = () => {
    console.log('DashboardPage: Opening create task dialog');
    setEditingTask(null);
    setIsCreateTaskOpen(true);
  };

  const handleCreateProject = () => {
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

  // Mobile layout (unchanged)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="space-y-8 p-6">
          <EnhancedDashboardHeader
            userName={user?.name?.split(' ')[0] || 'User'}
            onCreateTask={handleCreateTask}
            isLoading={false}
            stats={stats}
          />
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <DailyTasksSection 
                tasks={tasks} 
                onCreateTask={handleCreateTask}
                onTaskClick={handleTaskClick}
              />
              <RecentProjects projects={projects} />
            </div>
            
            <div className="space-y-8">
              <QuickActionsPanel onCreateTask={handleCreateTask} />
            </div>
          </div>

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
        </div>
      </div>
    );
  }

  // Premium desktop layout
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-dashboard-bg via-dashboard-card to-dashboard-bg"
    >
      <div className="max-w-7xl mx-auto">
        {/* Premium Header */}
        <PremiumDashboardHeader onCreateTask={handleCreateTask} />

        {/* Main Content */}
        <div className="px-8 py-8 space-y-8">
          {/* Glass Morphism Stats Grid */}
          <GlassMorphismStatsGrid 
            tasks={tasks}
            dailyScore={dailyScore}
          />

          {/* Floating Time Tracker */}
          <FloatingTimeTracker />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Intelligent Task Visualization */}
            <IntelligentTaskVisualization 
              tasks={tasks}
              onTaskClick={handleTaskClick}
            />

            {/* Interactive Quick Actions */}
            <InteractiveQuickActions 
              onCreateTask={handleCreateTask}
            />
          </div>
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
      </div>
    </motion.div>
  );
};

export default DashboardPage;
