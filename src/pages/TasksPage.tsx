
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTask } from '@/contexts/task';
import { Task, TaskStatus } from '@/types';
import TaskCommentsDialog from '@/components/TaskCommentsDialog';
import TaskHeader from '@/components/task/TaskHeader';
import TaskTabs from '@/components/task/TaskTabs';
import CreateTaskDialogEnhanced from '@/components/CreateTaskDialogEnhanced';
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
  
  // Show loading state
  if (isLoading) {
    console.log('🚨 TasksPage: Rendering loading state because isLoading is true');
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state if there's an error
  if (error) {
    console.log('🚨 TasksPage: Rendering error state:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading tasks</p>
            <p className="text-muted-foreground text-sm">{error.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  console.log('🚨 TasksPage: Not in loading state, processing tasks array:', tasks);
  
  if (!tasks || !Array.isArray(tasks)) {
    console.log('🚨 TasksPage: Tasks is not a valid array:', tasks);
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-muted-foreground">Tasks data is not available</p>
          </div>
        </div>
      </div>
    );
  }
  
  const todoTasks = tasks.filter((task) => task.status === 'To Do');
  const inProgressTasks = tasks.filter((task) => task.status === 'In Progress');
  const completedTasks = tasks.filter((task) => task.status === 'Completed');
  
  console.log('🚨 TasksPage: Filtered tasks:');
  console.log('🚨  - Todo:', todoTasks.length);
  console.log('🚨  - InProgress:', inProgressTasks.length);
  console.log('🚨  - Completed:', completedTasks.length);
  console.log('🚨  - Sample todo task:', todoTasks[0]);
  
  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'priority':
          const priorityValues = { 'High': 0, 'Medium': 1, 'Low': 2 };
          return priorityValues[a.priority] - priorityValues[b.priority];
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'upcoming':
          const now = new Date().getTime();
          const deadlineA = new Date(a.deadline).getTime();
          const deadlineB = new Date(b.deadline).getTime();
          const timeToDeadlineA = deadlineA - now;
          const timeToDeadlineB = deadlineB - now;
          const upcomingA = timeToDeadlineA > 0 ? timeToDeadlineA : Number.MAX_SAFE_INTEGER;
          const upcomingB = timeToDeadlineB > 0 ? timeToDeadlineB : Number.MAX_SAFE_INTEGER;
          return upcomingA - upcomingB;
        default:
          return 0;
      }
    });
  };
  
  const sortedTodo = sortTasks(todoTasks);
  const sortedInProgress = sortTasks(inProgressTasks);
  const sortedCompleted = sortTasks(completedTasks);

  console.log('🚨 TasksPage: Sorted tasks:');
  console.log('🚨  - Todo:', sortedTodo.length);
  console.log('🚨  - InProgress:', sortedInProgress.length);
  console.log('🚨  - Completed:', sortedCompleted.length);
  console.log('🚨 TasksPage: About to render main UI');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto max-w-none px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 space-y-10 relative z-10">
        {/* Enhanced Page Header */}
        <div className="animate-fade-in">
          <TaskHeader 
            onNewTask={() => {
              setEditingTask(undefined);
              setIsCreateTaskOpen(true);
            }}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>
        
        {/* Enhanced Main Content Area */}
        <div className="animate-fade-in delay-200">
          <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden">
            <TaskTabs
              todoTasks={sortedTodo}
              inProgressTasks={sortedInProgress}
              completedTasks={sortedCompleted}
              onEdit={handleEditTask}
              onNewTask={() => {
                setEditingTask(undefined);
                setIsCreateTaskOpen(true);
              }}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      </div>
      
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
    </div>
  );
};

export default TasksPage;
