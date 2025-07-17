
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
        "cursor-pointer transition-all duration-300 ease-out relative min-h-[280px] flex flex-col",
        "bg-card border border-border/50",
        "shadow-md hover:shadow-lg",
        "hover:scale-[1.01] hover:-translate-y-0.5",
        !isOverdue && getPriorityStyles(task.priority),
        isOverdue && [
          "ring-1 ring-red-400/50 shadow-red-100/30 dark:shadow-red-900/20",
          "bg-red-50/30 dark:bg-red-950/10",
          "border-red-300/50 dark:border-red-600/30"
        ],
        className
      )}
      onClick={onClick}
    >
      <div className="p-4 flex-1 flex flex-col min-h-0">
        {/* Header - Title and Priority */}
        <div className="flex-shrink-0 mb-3">
          <TaskCardHeader 
            title={task.title}
            priority={task.priority}
          />
        </div>

        {/* Description - Always show, with placeholder if empty */}
        <div className="flex-shrink-0 mb-3">
          {task.description ? (
            <TaskCardDescription description={task.description} />
          ) : (
            <div className="text-xs text-muted-foreground/50 italic">No description</div>
          )}
        </div>

        {/* Metadata - Takes available space */}
        <div className="flex-1 mb-3">
          <TaskCardMetadata 
            task={task}
            isOverdue={isOverdue}
          />
        </div>
        
        {/* Timer integration - Always visible */}
        <div className="flex-shrink-0 mb-3 min-h-[24px]">
          <TaskTimer 
            taskId={task.id}
            taskTitle={task.title}
            compact={true}
            showControls={false}
            className="justify-end"
          />
        </div>

        {/* Footer with status and controls */}
        <div className="flex-shrink-0 pt-3 border-t border-border/30">
          <TaskCardFooter
            status={task.status}
            isOverdue={isOverdue}
            commentCount={task.commentCount || 0}
            onShowComments={() => onClick && onClick()}
          />
        </div>
      </div>

      {/* Overdue indicator */}
      {isOverdue && (
        <div className="absolute bottom-3 right-3 z-10">
          <div className="flex items-center gap-1.5 bg-red-500 text-white px-2 py-1 rounded-full shadow-sm text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span>Overdue</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TaskCard;
