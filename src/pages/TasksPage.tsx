import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ImportFromGoogleCalendar } from '@/components/google-sync/ImportFromGoogleCalendar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { usePersonalTasks } from '@/hooks/usePersonalTasks';
import { Task, TaskStatus } from '@/types';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import TaskCommentsDialog from '@/components/TaskCommentsDialog';
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';
import TasksPageLoading from '@/components/task/TasksPageLoading';
import TasksPageError from '@/components/task/TasksPageError';
import TasksPageContent from '@/components/task/TasksPageContent';
import { useAuth } from '@/contexts/AuthContext';

import { useDebounce } from '@/utils/performanceUtils';
import { toast } from '@/components/ui/sonner';
import { useTask } from '@/contexts/task';

const TasksPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  
  const location = useLocation();
  
  useEffect(() => {
    if (location.pathname.endsWith('/create')) {
      setIsCreateTaskOpen(true);
    }
  }, [location.pathname]);

  // Use new personal tasks hook for refined filtering
  const { tasks, isLoading, error, refetch } = usePersonalTasks();
  
  // Use TaskContext for mutations (update, delete operations)
  const { updateTaskStatus, createTask, updateTask } = useTask();
  
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [sortBy, setSortBy] = useState('deadline');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showComments, setShowComments] = useState(false);

  // Setup keyboard shortcuts for this page
  useKeyboardShortcuts({
    onNewTask: () => {
      setEditingTask(undefined);
      setIsCreateTaskOpen(true);
    },
    onRefresh: () => {
      refetch();
      toast.info('Personal tasks refreshed');
    }
  });
  
  // Debounced handlers to prevent rapid clicking
  const debouncedEditTask = useDebounce((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, 200);
  
  // Memoized handlers
  const handleEditTask = useMemo(() => debouncedEditTask, [debouncedEditTask]);
  
  const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status);
      
      // Invalidate cache first to force fresh data
      queryClient.invalidateQueries({ 
        queryKey: ['personal-tasks', user?.organizationId, user?.id] 
      });
      
      // Then force immediate refetch
      await refetch({ cancelRefetch: true });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('TasksPage: Error updating task status:', error);
      }
      toast.error('Failed to update task status');
    }
  }, [updateTaskStatus, refetch, queryClient, user?.organizationId, user?.id]);
  
  const handleTaskDialogComplete = useMemo(() => () => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
    // Refresh personal tasks after task creation/update
    refetch();
  }, [refetch]);

  const handleNewTask = useMemo(() => () => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  }, []);
  
  // Show loading state
  if (isLoading) {
    return <TasksPageLoading />;
  }
  
  // Show error state if tasks is null or undefined
  if (!tasks || error) {
    return <TasksPageError error={error || new Error("Failed to load personal tasks")} />;
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
      
      <EnhancedCreateTaskDialog
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        onTaskComplete={handleTaskDialogComplete}
        createTask={createTask}
        updateTask={updateTask}
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
