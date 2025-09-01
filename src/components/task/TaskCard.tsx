
import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { isTaskOverdue } from '@/utils/taskUtils';
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
  const isMobile = useIsMobile();
  const isOverdue = isTaskOverdue(task);
  const isCompleted = task.status === 'Completed';
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
        "cursor-pointer relative flex flex-col touch-manipulation",
        // Mobile-optimized minimum height and padding
        isMobile ? "min-h-[280px]" : "min-h-[320px]",
        "border border-border/60 rounded-xl overflow-hidden",
        "transition-all duration-300 ease-out",
        "bg-gradient-to-br from-card/98 to-card/90",
        "backdrop-blur-sm shadow-lg",
        // Mobile-optimized hover and active states
        isMobile ? [
          "active:scale-[0.98] active:shadow-md",
          "touch-manipulation"
        ] : [
          "hover:shadow-xl hover:shadow-primary/5",
          "hover:scale-[1.02] hover:-translate-y-1"
        ],
        "group",
        // Completed state (green glow) - takes precedence over all other states
        isCompleted && [
          "ring-2 ring-green-500/40 shadow-green-100/40 dark:shadow-green-900/30",
          "bg-gradient-to-br from-green-50/40 to-green-100/20 dark:from-green-950/20 dark:to-green-900/10",
          "border-green-300/60 dark:border-green-600/40"
        ],
        // Overdue state only if not completed
        !isCompleted && isOverdue && [
          "ring-2 ring-red-400/60 shadow-red-100/40 dark:shadow-red-900/30",
          "bg-gradient-to-br from-red-50/40 to-red-100/20 dark:from-red-950/20 dark:to-red-900/10",
          "border-red-300/60 dark:border-red-600/40"
        ],
        // Priority styles only if not completed and not overdue
        !isCompleted && !isOverdue && getPriorityStyles(task.priority),
        className
      )}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Open task details for ${task.title}`}
    >
      {/* Priority indicator - left border */}
      <div className={cn(
        "absolute top-0 bottom-0 left-0",
        isMobile ? "w-2" : "w-1.5",
        task.priority === 'High' && "bg-gradient-to-b from-red-400 to-red-500",
        task.priority === 'Medium' && "bg-gradient-to-b from-amber-400 to-amber-500",
        task.priority === 'Low' && "bg-gradient-to-b from-blue-400 to-blue-500"
      )} />

      {/* Priority bar on top */}
      <div className={cn(
        "absolute top-0 left-0 right-0",
        isMobile ? "h-1.5" : "h-1",
        task.priority === 'High' && "bg-gradient-to-r from-red-400 to-red-500",
        task.priority === 'Medium' && "bg-gradient-to-r from-amber-400 to-amber-500",
        task.priority === 'Low' && "bg-gradient-to-r from-blue-400 to-blue-500"
      )} />

      {/* Card content with mobile-optimized spacing */}
      <div className={cn(
        "flex-1 flex flex-col min-h-0",
        isMobile ? "p-4 space-y-3" : "p-5 space-y-3.5"
      )}>
        {/* Header Section */}
        <div className="flex-shrink-0">
          <TaskCardHeader 
            title={task.title}
            priority={task.priority}
          />
        </div>

        {/* Description Section with mobile-optimized visual separation */}
        <div className={cn(
          "flex-shrink-0 bg-muted/10 rounded-md border-l-2 border-border/30",
          isMobile ? "p-2" : "p-2.5"
        )}>
          <TaskCardDescription description={task.description} />
        </div>

        {/* Metadata Section - Takes available space */}
        <div className="flex-1 min-h-0">
          <TaskCardMetadata 
            task={task}
            isOverdue={isOverdue}
          />
        </div>
        
        {/* Timer Section - Mobile-optimized */}
        <div className="flex-shrink-0">
          <div className={cn(
            "bg-muted/20 backdrop-blur-sm rounded-lg border", 
            "border-border/30 shadow-sm",
            isMobile ? "p-2" : "p-2.5",
            isMobile ? [
              "active:border-border/70 active:shadow-sm transition-all duration-200"
            ] : [
              "hover:border-border/50 hover:shadow-md transition-all duration-300"
            ]
          )}>
            <TaskTimer 
              taskId={task.id}
              taskTitle={task.title}
              compact={true}
              showControls={true}
              className="justify-between"
            />
          </div>
        </div>

        {/* Footer Section - with mobile-optimized divider */}
        <div className={cn(
          "flex-shrink-0 border-t border-border/30",
          isMobile ? "pt-2 mt-1" : "pt-2.5 mt-1"
        )}>
          <TaskCardFooter
            status={task.status}
            isOverdue={isOverdue}
            commentCount={commentCount}
            onShowComments={() => onClick && onClick()}
          />
        </div>
      </div>

      {/* Remove the overdue indicator from here since it's now in the footer */}
    </Card>
  );
};

export default TaskCard;
