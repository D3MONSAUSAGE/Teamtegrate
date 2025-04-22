
import React from 'react';
import { Task } from '@/types';
import TaskCard from '../TaskCard';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onNewTask: () => void;
  onShowComments?: (task: Task) => void;
  emptyMessage?: string;
}

const TaskList = ({ tasks, onEdit, onNewTask, onShowComments, emptyMessage = "No tasks" }: TaskListProps) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onEdit={onEdit} 
          onShowComments={onShowComments}
        />
      ))}
    </div>
  );
};

export default TaskList;
