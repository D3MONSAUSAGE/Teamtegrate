
import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import TaskTimer from './TaskTimer';
import TaskCardHeader from './TaskCardHeader';
import TaskCardDescription from './TaskCardDescription';
import TaskCardMetadata from './TaskCardMetadata';
import TaskCardFooter from './TaskCardFooter';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, className }) => {
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';
  const commentCount = task.comments?.length || 0;
  
  const getPriorityStyles = (priority: string) => {
    switch(priority) {
      case 'High': 
        return 'shadow-red-100/20 dark:shadow-red-900/10 hover:shadow-red-200/30 dark:hover:shadow-red-800/20 hover:border-red-200/40 dark:hover:border-red-700/30';
      case 'Medium': 
        return 'shadow-amber-100/20 dark:shadow-amber-900/10 hover:shadow-amber-200/30 dark:hover:shadow-amber-800/20 hover:border-amber-200/40 dark:hover:border-amber-700/30';
      case 'Low': 
        return 'shadow-blue-100/20 dark:shadow-blue-900/10 hover:shadow-blue-200/30 dark:hover:shadow-blue-800/20 hover:border-blue-200/40 dark:hover:border-blue-700/30';
      default: 
        return 'shadow-gray-100/20 dark:shadow-gray-800/10 hover:shadow-gray-200/30 dark:hover:shadow-gray-700/20 hover:border-gray-200/40 dark:hover:border-gray-700/30';
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 ease-out relative min-h-[300px] flex flex-col",
        "bg-gradient-to-br from-card/95 to-card/85 backdrop-blur-sm",
        "border border-border/60 rounded-xl",
        "shadow-md hover:shadow-xl",
        "hover:scale-[1.01] hover:-translate-y-1",
        "group overflow-hidden",
        !isOverdue && getPriorityStyles(task.priority),
        isOverdue && [
          "ring-2 ring-red-400/60 shadow-red-100/40 dark:shadow-red-900/30",
          "bg-gradient-to-br from-red-50/40 to-red-100/20 dark:from-red-950/20 dark:to-red-900/10",
          "border-red-300/60 dark:border-red-600/40"
        ],
        className
      )}
      onClick={onClick}
    >
      {/* Priority accent line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 rounded-t-xl",
        task.priority === 'High' && "bg-gradient-to-r from-red-400 to-red-500",
        task.priority === 'Medium' && "bg-gradient-to-r from-amber-400 to-amber-500",
        task.priority === 'Low' && "bg-gradient-to-r from-blue-400 to-blue-500"
      )} />

      <div className="p-6 flex-1 flex flex-col min-h-0 space-y-4">
        {/* Header Section */}
        <div className="flex-shrink-0">
          <TaskCardHeader 
            title={task.title}
            priority={task.priority}
          />
        </div>

        {/* Description Section */}
        <div className="flex-shrink-0">
          <TaskCardDescription description={task.description} />
        </div>

        {/* Metadata Section - Takes available space */}
        <div className="flex-1 min-h-0">
          <TaskCardMetadata 
            task={task}
            isOverdue={isOverdue}
          />
        </div>
        
        {/* Timer Section */}
        <div className="flex-shrink-0">
          <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
            <TaskTimer 
              taskId={task.id}
              taskTitle={task.title}
              compact={true}
              showControls={true}
              className="justify-between"
            />
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex-shrink-0 pt-2 border-t border-border/40">
          <TaskCardFooter
            status={task.status}
            isOverdue={isOverdue}
            commentCount={commentCount}
            onShowComments={() => onClick && onClick()}
          />
        </div>
      </div>

      {/* Overdue indicator */}
      {isOverdue && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-semibold animate-pulse">
            <AlertCircle className="w-3 h-3" />
            <span>Overdue</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TaskCard;
