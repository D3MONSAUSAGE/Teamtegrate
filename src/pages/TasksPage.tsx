
import React, { useState, useEffect, useMemo } from 'react';
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
import { useDebounce } from '@/utils/performanceUtils';

const TasksPage = () => {
  const navigate = useNavigate();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  
  useEffect(() => {
    const path = window.location.pathname;
    if (path.endsWith('/create')) {
      setIsCreateTaskOpen(true);
    }
  }, []);

  // Get tasks directly from the enhanced hook
  const { tasks, isLoading, error } = useTasksPageData();
  
  // Get the update function from the context
  const { updateTaskStatus } = useTask();
  
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [sortBy, setSortBy] = useState('deadline');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showComments, setShowComments] = useState(false);
  
  // Debounced handlers to prevent rapid clicking
  const debouncedEditTask = useDebounce((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, 200);
  
  const debouncedStatusChange = useDebounce(async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('TasksPage: Error updating task status:', error);
      }
      toast.error('Failed to update task status');
    }
  }, 300);
  
  // Memoized handlers
  const handleEditTask = useMemo(() => debouncedEditTask, [debouncedEditTask]);
  const handleStatusChange = useMemo(() => debouncedStatusChange, [debouncedStatusChange]);
  
  const handleTaskDialogComplete = useMemo(() => () => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
  }, []);

  const handleNewTask = useMemo(() => () => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  }, []);
  
  // Show loading state
  if (isLoading) {
    return <TasksPageLoading />;
  }
  
  // Show error state if there's an error
  if (error) {
    return <TasksPageError error={error} />;
  }

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
