
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Task, TaskStatus } from '@/types';
import { cn } from "@/lib/utils";
import TaskCardHeader from './task/TaskCardHeader';
import TaskCardActions from './task/TaskCardActions';
import TaskCardDescription from './task/TaskCardDescription';
import TaskCardMetadata from './task/TaskCardMetadata';
import TaskCardFooter from './task/TaskCardFooter';
import { useTask } from '@/contexts/task';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onAssign?: (task: Task) => void;
  onShowComments?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onAssign, onShowComments }) => {
  const { updateTaskStatus, deleteTask } = useTask();

  // Define colorful backgrounds for priority levels
  const getPriorityBackground = (priority: string) => {
    switch(priority) {
      case 'Low': return 'bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'Medium': return 'bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800';
      case 'High': return 'bg-rose-50 dark:bg-rose-900/10 text-rose-900 dark:text-rose-100 border-rose-200 dark:border-rose-800';
      default: return 'bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    }
  };

  const isTaskOverdue = () => {
    const now = new Date();
    return task.status !== 'Completed' && task.deadline < now;
  };

  const commentCount = task.comments?.length || 0;

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTaskStatus(task.id, newStatus);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleShowComments = () => {
    if (onShowComments) {
      onShowComments(task);
    }
  };

  return (
    <Card className={cn(
      "card-hover cursor-pointer border-2", 
      getPriorityBackground(task.priority), 
      isTaskOverdue() && "ring-2 ring-red-500 dark:ring-red-400"
    )}>
      <TaskCardHeader 
        title={task.title} 
        priority={task.priority}
      />
      <CardContent className="space-y-2 pt-0 md:pt-1 px-4 md:px-6 pb-4">
        <TaskCardDescription description={task.description} />
        
        <TaskCardMetadata 
          deadline={task.deadline}
          assignedToName={task.assignedToName}
        />
        
        <TaskCardFooter 
          status={task.status}
          isOverdue={isTaskOverdue()}
          commentCount={commentCount}
          onShowComments={handleShowComments}
          onStatusChange={handleStatusChange}
        />
      </CardContent>

      <div className="absolute top-1 right-1">
        <TaskCardActions 
          task={task}
          onEdit={onEdit}
          onAssign={onAssign}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteTask}
          onShowComments={handleShowComments}
        />
      </div>
    </Card>
  );
};

export default TaskCard;
