
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import StatsCards from '@/components/dashboard/StatsCards';
import TasksOverview from '@/components/dashboard/TasksOverview';
import ProjectsOverview from '@/components/dashboard/ProjectsOverview';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import CreateTaskDialog from '@/components/dialogs/CreateTaskDialog';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, projects } = useTask();
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

  return (
    <div className="space-y-6">
      <DashboardHeader onCreateTask={handleCreateTask} />
      
      <StatsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TasksOverview tasks={tasks} onCreateTask={handleCreateTask} />
        <ProjectsOverview projects={projects} />
      </div>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        onSubmit={handleTaskSubmit}
      />

      <FloatingActionButton onCreateTask={handleCreateTask} />
    </div>
  );
};

export default DashboardPage;
