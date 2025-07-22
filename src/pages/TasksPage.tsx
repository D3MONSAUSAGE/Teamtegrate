
import React, { useState } from 'react';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import TaskTabs from '@/components/task/TaskTabs';
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const TasksPage = () => {
  const { 
    tasks,
    isLoading,
    updateTaskStatus,
    refreshTasks,
    createTask
  } = useTask();
  
  const isMobile = useIsMobile();
  
  // Local state for dialog management
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };

  // Group tasks by status
  const todoTasks = tasks.filter(task => task.status === 'To Do');
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress');
  const completedTasks = tasks.filter(task => task.status === 'Completed');

  const handleRefresh = async () => {
    await refreshTasks();
  };

  const handleTaskStatusChange = async (taskId: string, status: 'To Do' | 'In Progress' | 'Completed') => {
    try {
      await updateTaskStatus(taskId, status);
    } catch (error) {
      console.error('Failed to update task status:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center",
        isMobile ? "min-h-screen-mobile safe-area-inset" : "min-h-screen"
      )}>
        <div className="animate-pulse text-muted-foreground mobile-text-base">
          Loading tasks...
        </div>
      </div>
    );
  }

  const TaskContent = () => (
    <div className={cn(
      "space-y-6",
      isMobile ? "safe-area-left safe-area-right" : ""
    )}>
      <div className={cn(
        isMobile ? "px-4 safe-area-top" : ""
      )}>
        <div>
          <h1 className={cn(
            "font-bold tracking-tight",
            isMobile ? "text-2xl mobile-text-xl" : "text-3xl"
          )}>
            My Tasks
          </h1>
          <p className={cn(
            "text-muted-foreground mt-1",
            isMobile ? "text-sm mobile-text-sm" : "text-base"
          )}>
            Manage and track your assigned tasks
          </p>
        </div>
      </div>

      <TaskTabs
        todoTasks={todoTasks}
        inProgressTasks={inProgressTasks}
        completedTasks={completedTasks}
        onEdit={handleEditTask}
        onNewTask={handleCreateTask}
        onStatusChange={handleTaskStatusChange}
      />

      {/* Enhanced Create Task Dialog */}
      <EnhancedCreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
      />

      {/* Mobile FAB */}
      {isMobile && (
        <FloatingActionButton
          onCreateTask={handleCreateTask}
          className="z-50"
        />
      )}
    </div>
  );

  // Wrap with pull-to-refresh on mobile
  if (isMobile) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <TaskContent />
      </PullToRefresh>
    );
  }

  return <TaskContent />;
};

export default TasksPage;
