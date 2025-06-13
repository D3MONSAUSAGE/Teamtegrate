
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTask } from '@/contexts/task';
import { Task, TaskStatus } from '@/types';
import TaskCommentsDialog from '@/components/TaskCommentsDialog';
import TaskHeader from '@/components/task/TaskHeader';
import TaskTabs from '@/components/task/TaskTabs';
import CreateTaskDialogEnhanced from '@/components/CreateTaskDialogEnhanced';
import { toast } from '@/components/ui/sonner';

const TasksPage = () => {
  const navigate = useNavigate();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  
  useEffect(() => {
    const path = window.location.pathname;
    if (path.endsWith('/create')) {
      setIsCreateTaskOpen(true);
    }
  }, []);

  // Use the same data source as the dashboard - through TaskContext
  const { tasks, isLoading, updateTaskStatus } = useTask();
  
  // Debug logging
  console.log('TasksPage: tasks:', tasks);
  console.log('TasksPage: isLoading:', isLoading);
  console.log('TasksPage: tasks length:', tasks?.length || 0);
  
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
      console.log(`Updating task ${taskId} status to ${status}`);
      await updateTaskStatus(taskId, status);
      console.log(`Successfully updated task ${taskId} status to ${status}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };
  
  const handleTaskDialogComplete = () => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
  };
  
  // Show loading state
  if (isLoading) {
    console.log('TasksPage: Rendering loading state');
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
  
  console.log('TasksPage: Not in loading state, tasks array:', tasks);
  
  const todoTasks = tasks.filter((task) => task.status === 'To Do');
  const inProgressTasks = tasks.filter((task) => task.status === 'In Progress');
  const completedTasks = tasks.filter((task) => task.status === 'Completed');
  
  console.log('TasksPage: Filtered tasks - Todo:', todoTasks.length, 'InProgress:', inProgressTasks.length, 'Completed:', completedTasks.length);
  
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

  console.log('TasksPage: Sorted tasks - Todo:', sortedTodo.length, 'InProgress:', sortedInProgress.length, 'Completed:', sortedCompleted.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 lg:px-6 py-8 space-y-10 relative z-10">
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
