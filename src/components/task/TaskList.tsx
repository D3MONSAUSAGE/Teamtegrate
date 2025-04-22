
import React, { useState } from 'react';
import { Task } from '@/types';
import TaskCard from '../TaskCard';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import TaskCommentsDialog from '@/components/TaskCommentsDialog';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onNewTask: () => void;
  emptyMessage?: string;
}

const TaskList = ({ tasks, onEdit, onNewTask, emptyMessage = "No tasks" }: TaskListProps) => {
  // State to track which task is selected for details
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleOpenDetails = (task: Task) => {
    setSelectedTask(task);
    setShowDetails(true);
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-card p-6 rounded-lg border text-center">
        <p className="text-gray-500 dark:text-gray-300">{emptyMessage}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2" 
          onClick={onNewTask}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
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
          />
        ))}
      </div>
      <TaskCommentsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        task={selectedTask}
      />
    </>
  );
};

export default TaskList;

