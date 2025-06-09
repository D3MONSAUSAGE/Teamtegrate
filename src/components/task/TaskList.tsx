
import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import TaskCard from '@/components/task-card';
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from 'lucide-react';
import TaskDetailDrawer from './TaskDetailDrawer';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onNewTask: () => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
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

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    if (onStatusChange) {
      console.log(`TaskList: Changing task ${taskId} status to ${status}`);
      onStatusChange(taskId, status);
    } else {
      console.warn("Status change handler not provided to TaskList");
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="modern-card bg-gradient-to-br from-muted/30 to-muted/10 border border-border/30 p-8 rounded-2xl backdrop-blur-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-muted to-muted/50 rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground mb-6">Get started by creating your first task</p>
          <Button 
            variant="outline" 
            size="lg" 
            className="interactive-button bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80 px-6" 
            onClick={onNewTask}
          >
            <Plus className="h-4 w-4 mr-2" /> 
            Add Task
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className="animate-fade-in"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              animationFillMode: 'both'
            }}
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
      <TaskDetailDrawer
        open={showDetails}
        onOpenChange={setShowDetails}
        task={selectedTask}
      />
    </>
  );
};

export default TaskList;
