
import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import TaskCard from '@/components/task-card';
import { Button } from "@/components/ui/button";
import { Plus, Rocket } from 'lucide-react';
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
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
            <Rocket className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground mb-6">Create your first task to get started!</p>
          <Button 
            variant="outline" 
            onClick={onNewTask}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> 
            Add Task
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id}
            task={task} 
            onEdit={onEdit} 
            onClick={() => handleOpenDetails(task)}
            onStatusChange={handleStatusChange}
          />
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
