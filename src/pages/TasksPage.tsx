
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTask } from '@/contexts/task';
import { Task, TaskStatus } from '@/types';
import TaskCommentsDialog from '@/components/TaskCommentsDialog';
import TaskHeader from '@/components/task/TaskHeader';
import TaskTabs from '@/components/task/TaskTabs';
import CreateTaskDialogWithAI from '@/components/CreateTaskDialogWithAI';
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

  // Render the general tasks view
  const { tasks, updateTaskStatus } = useTask();
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [sortBy, setSortBy] = useState('deadline');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showComments, setShowComments] = useState(false);
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };
  
  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    try {
      console.log(`Updating task ${taskId} status to ${status}`);
      updateTaskStatus(taskId, status);
      toast.success(`Task status updated to ${status}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };
  
  const handleTaskDialogComplete = () => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
  };
  
  const todoTasks = tasks.filter((task) => task.status === 'To Do');
  const inProgressTasks = tasks.filter((task) => task.status === 'In Progress');
  const completedTasks = tasks.filter((task) => task.status === 'Completed');
  
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-6 space-y-8">
        {/* Page Header */}
        <TaskHeader 
          onNewTask={() => {
            setEditingTask(undefined);
            setIsCreateTaskOpen(true);
          }}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        
        {/* Main Content Area */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
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
      
      <CreateTaskDialogWithAI
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
