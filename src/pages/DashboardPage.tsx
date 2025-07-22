
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import EnhancedDashboardHeader from '@/components/dashboard/EnhancedDashboardHeader';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import RecentProjects from '@/components/dashboard/RecentProjects';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';
import CreateTaskDialog from '@/components/dialogs/CreateTaskDialog';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, projects, dailyScore } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const handleCreateTask = () => {
    console.log('DashboardPage: Opening create task dialog');
    setIsCreateTaskOpen(true);
  };

  const handleTaskSubmit = async (taskData: any) => {
    console.log('DashboardPage: Task submitted:', taskData);
    // Task creation logic will be handled by the dialog component
  };

  if (!user) return null;

  // Calculate stats for the enhanced header
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

  const stats = {
    todaysCount: todaysTasks.length,
    upcomingCount: upcomingTasks.length,
    projectsCount: projects.length
  };

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
            <DailyTasksSection tasks={tasks} onCreateTask={handleCreateTask} />
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
        />

        <FloatingActionButton onCreateTask={handleCreateTask} />
      </div>
    </div>
  );
};

export default DashboardPage;
