
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTask } from '@/contexts/task';
import { Task, TaskStatus } from '@/types';
import TaskCommentsDialog from '@/components/TaskCommentsDialog';
import CreateTaskDialogEnhanced from '@/components/CreateTaskDialogEnhanced';
import TasksPageLoading from '@/components/task/TasksPageLoading';
import TasksPageError from '@/components/task/TasksPageError';
import TasksPageContent from '@/components/task/TasksPageContent';
import { toast } from '@/components/ui/sonner';
import { useTasksPageData } from '@/hooks/useTasksPageData';

const TasksPage = () => {
  console.log('🚨 TasksPage: Component rendering');
  console.log('🚨 Current URL:', window.location.href);
  console.log('🚨 Current pathname:', window.location.pathname);
  
  const navigate = useNavigate();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  
  useEffect(() => {
    console.log('🚨 TasksPage: useEffect running - component mounted!');
    const path = window.location.pathname;
    console.log('🚨 TasksPage: Current path in useEffect:', path);
    if (path.endsWith('/create')) {
      setIsCreateTaskOpen(true);
    }
  }, []);

  // Get tasks directly from the enhanced hook
  const { tasks, isLoading, error } = useTasksPageData();
  
  // Enhanced debug logging
  console.log('🚨 TasksPage: useTasksPageData hook result:');
  console.log('🚨  - tasks:', tasks);
  console.log('🚨  - isLoading:', isLoading);
  console.log('🚨  - error:', error);
  console.log('🚨  - tasks length:', tasks?.length || 0);
  console.log('🚨  - tasks is array:', Array.isArray(tasks));
  
  // Get the update function from the context
  const { updateTaskStatus } = useTask();
  
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [sortBy, setSortBy] = useState('deadline');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showComments, setShowComments] = useState(false);
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };
  
  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      console.log(`🚨 TasksPage: Updating task ${taskId} status to ${status}`);
      await updateTaskStatus(taskId, status);
      console.log(`🚨 TasksPage: Successfully updated task ${taskId} status to ${status}`);
    } catch (error) {
      console.error('🚨 TasksPage: Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };
  
  const handleTaskDialogComplete = () => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
  };

  const handleNewTask = () => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  };
  
  // Show loading state
  if (isLoading) {
    console.log('🚨 TasksPage: Rendering loading state because isLoading is true');
    return <TasksPageLoading />;
  }
  
  // Show error state if there's an error
  if (error) {
    console.log('🚨 TasksPage: Rendering error state:', error);
    return <TasksPageError error={error} />;
  }
  
  console.log('🚨 TasksPage: Not in loading state, processing tasks array:', tasks);

  return (
    <>
      <TasksPageContent
        tasks={tasks}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onNewTask={handleNewTask}
        onEditTask={handleEditTask}
        onStatusChange={handleStatusChange}
      />
      
      <CreateTaskDialogEnhanced
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        onTaskComplete={handleTaskDialogComplete}
      />
      
      <TaskCommentsDialog
        open={showComments}
        onOpenChange={setShowComments}
        task={selectedTask}
      />
    </>
  );
};

export default TasksPage;
