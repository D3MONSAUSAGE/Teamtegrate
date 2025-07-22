
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import EnhancedDashboardHeader from '@/components/dashboard/EnhancedDashboardHeader';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import RecentProjects from '@/components/dashboard/RecentProjects';
import QuickActionsPanel from '@/components/dashboard/QuickActionsPanel';
import CreateTaskDialog from '@/components/dialogs/CreateTaskDialog';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, projects, dailyScore } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleCreateTask = () => {
    console.log('DashboardPage: Opening create task dialog');
    setEditingTask(null); // Clear any editing task
    setIsCreateTaskOpen(true);
  };

  const handleCreateProject = () => {
    console.log('DashboardPage: Opening create project dialog');
    setIsCreateProjectOpen(true);
  };

  const handleTaskSubmit = async (taskData: any) => {
    console.log('DashboardPage: Task submitted:', taskData);
    // Task creation logic will be handled by the dialog component
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
    // Refresh projects list if needed
    console.log('DashboardPage: Project created successfully');
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

        {/* Enhanced Floating Action Button */}
        <FloatingActionButton 
          onCreateTask={handleCreateTask}
          onCreateProject={handleCreateProject}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
