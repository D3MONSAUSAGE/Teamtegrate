
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskCard from '@/components/TaskCard';
import { Task } from '@/types';

interface TasksTabPanelProps {
  tasks: Task[];
  status: string;
  onEdit: (task: Task) => void;
  onAddTask: () => void;
}

const emptyMessages: Record<string, string> = {
  todo: "No to-do tasks",
  inprogress: "No in-progress tasks",
  pending: "No pending tasks",
  completed: "No completed tasks",
};

const TasksTabPanel: React.FC<TasksTabPanelProps> = ({ tasks, status, onEdit, onAddTask }) => {
  if (tasks.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-card p-6 rounded-lg border text-center">
      <p className="text-gray-500 dark:text-gray-300">{emptyMessages[status]}</p>
      {status === 'todo' && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={onAddTask}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
      )}
    </div>
  );
};

export default TasksTabPanel;
