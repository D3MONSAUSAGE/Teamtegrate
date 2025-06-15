
import React from 'react';
import { Task, TaskStatus } from '@/types';
import TaskHeader from '@/components/task/TaskHeader';
import TaskTabs from '@/components/task/TaskTabs';

interface TasksPageContentProps {
  tasks: Task[];
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  onNewTask: () => void;
  onEditTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>;
}

const TasksPageContent = ({ 
  tasks, 
  sortBy, 
  setSortBy, 
  onNewTask, 
  onEditTask, 
  onStatusChange 
}: TasksPageContentProps) => {
  console.log('TasksPageContent: Processing authorized tasks array:', {
    taskCount: tasks?.length || 0,
    hasValidArray: tasks && Array.isArray(tasks)
  });
  
  if (!tasks || !Array.isArray(tasks)) {
    console.log('TasksPageContent: Tasks is not a valid array:', tasks);
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
  
  console.log('TasksPageContent: Filtered authorized tasks:', {
    todo: todoTasks.length,
    inProgress: inProgressTasks.length,
    completed: completedTasks.length,
    total: tasks.length
  });
  
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

  console.log('TasksPageContent: Ready to render authorized tasks UI');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full px-2 sm:px-4 lg:px-6 py-8 space-y-10 relative z-10">
        {/* Enhanced Page Header */}
        <div className="animate-fade-in">
          <TaskHeader 
            onNewTask={onNewTask}
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
              onEdit={onEditTask}
              onNewTask={onNewTask}
              onStatusChange={onStatusChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksPageContent;
