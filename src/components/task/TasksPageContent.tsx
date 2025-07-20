
import React, { useMemo } from 'react';
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
  
  if (!tasks || !Array.isArray(tasks)) {
    return (
      <div className="min-h-screen-mobile bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
        <div className="flex items-center justify-center min-h-screen-mobile">
          <div className="text-center">
            <p className="text-muted-foreground">Tasks data is not available</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Memoize filtered tasks to prevent recalculation on every render
  const { todoTasks, inProgressTasks, completedTasks } = useMemo(() => {
    const todo = tasks.filter((task) => task.status === 'To Do');
    const inProgress = tasks.filter((task) => task.status === 'In Progress');
    const completed = tasks.filter((task) => task.status === 'Completed');
    
    return { 
      todoTasks: todo, 
      inProgressTasks: inProgress, 
      completedTasks: completed 
    };
  }, [tasks]);
  
  // Memoize sort function to prevent recreation
  const sortTasks = useMemo(() => (tasksToSort: Task[]) => {
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
  }, [sortBy]);
  
  // Memoize sorted tasks
  const { sortedTodo, sortedInProgress, sortedCompleted } = useMemo(() => ({
    sortedTodo: sortTasks(todoTasks),
    sortedInProgress: sortTasks(inProgressTasks),
    sortedCompleted: sortTasks(completedTasks)
  }), [sortTasks, todoTasks, inProgressTasks, completedTasks]);

  return (
    <div className="min-h-screen-mobile bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden no-scrollbar">
      {/* Simplified background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-primary/3 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-accent/3 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full space-y-6 sm:space-y-8 lg:space-y-10 relative z-10">
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
          <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
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
