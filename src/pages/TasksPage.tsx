
import React from 'react';
import { Capacitor } from '@capacitor/core';
import MobileTasksPage from '@/components/mobile/MobileTasksPage';
import TasksPageContent from '@/components/task/TasksPageContent';
import { useTask } from '@/contexts/task/TaskContext';
import { Task, TaskStatus } from '@/types';
import { toast } from 'sonner';
import { useState } from 'react';

const TasksPage = () => {
  const { tasks, updateTaskStatus } = useTask();
  const [sortBy, setSortBy] = useState('created');
  const isMobile = Capacitor.isNativePlatform() || window.innerWidth < 768;

  // Return mobile version for mobile devices
  if (isMobile) {
    return <MobileTasksPage />;
  }

  const handleNewTask = () => {
    // TODO: Implement new task creation
    toast.info('New task creation coming soon!');
  };

  const handleEditTask = (task: Task) => {
    // TODO: Implement task editing
    toast.info('Task editing coming soon!');
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status);
      toast.success('Task status updated successfully!');
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  return (
    <TasksPageContent
      tasks={tasks}
      sortBy={sortBy}
      setSortBy={setSortBy}
      onNewTask={handleNewTask}
      onEditTask={handleEditTask}
      onStatusChange={handleStatusChange}
    />
  );
};

export default TasksPage;
