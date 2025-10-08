
import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import TaskCard from '@/components/task-card';
import { Button } from "@/components/ui/button";
import { Plus, Rocket, Sparkles, Shield } from 'lucide-react';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onNewTask: () => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => Promise<void>;
  emptyMessage?: string;
}

const TaskList = ({ tasks, onEdit, onNewTask, onStatusChange, emptyMessage = "No tasks" }: TaskListProps) => {
  // State to track which task is selected for details
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleOpenDetails = (task: Task) => {
    setSelectedTask(task);
    setShowDetails(true);
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus): Promise<void> => {
    if (onStatusChange) {
      console.log(`🎯 TaskList: Changing task ${taskId} status to ${status}`);
      await onStatusChange(taskId, status);
    } else {
      console.warn("❌ TaskList: Status change handler not provided");
      throw new Error("Status change handler not available");
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-border/30 shadow-xl">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-6 w-6 text-accent animate-pulse" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">{emptyMessage}</h3>
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            You can only see tasks that are assigned to you or in projects you have access to. Contact your manager or admin to be assigned to more tasks.
          </p>
          <Button 
            variant="outline" 
            onClick={onNewTask}
            className="gap-3 h-12 px-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 hover:border-primary/50 hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <Plus className="h-5 w-5" /> 
            <span className="font-semibold">Create Task</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3 lg:gap-4">
        {tasks.map((task, index) => (
          <div 
            key={task.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <TaskCard 
              task={task} 
              onEdit={onEdit} 
              onClick={() => handleOpenDetails(task)}
              onStatusChange={handleStatusChange}
            />
          </div>
        ))}
      </div>
      <TaskDetailDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        task={selectedTask}
        onEdit={onEdit}
        onUpdateTaskStatus={handleStatusChange}
        onDeleteTask={async (taskId: string) => {
          // Status change to trigger refresh after delete
          await handleStatusChange(taskId, 'To Do');
        }}
      />
    </>
  );
};

export default TaskList;
