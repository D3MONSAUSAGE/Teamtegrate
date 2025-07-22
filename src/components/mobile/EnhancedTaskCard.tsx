
import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { Eye, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import MobileTaskDetailDialog from './MobileTaskDetailDialog';

interface EnhancedTaskCardProps {
  task: Task;
  className?: string;
}

const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = ({ task, className }) => {
  const { updateTaskStatus } = useTask();
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';
  
  const formatDeadline = (deadline: Date) => {
    const now = new Date();
    const diffDays = differenceInDays(deadline, now);
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    
    return format(deadline, "MMM d");
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Low': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'Medium': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800';
      case 'High': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 dark:bg-gray-800/40 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      toast.success('Task status updated');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className={cn(
        "bg-card rounded-xl border border-border/60 p-4 space-y-4",
        "shadow-sm hover:shadow-md transition-all duration-200",
        "touch-manipulation",
        isOverdue && "ring-2 ring-red-400/60 bg-red-50/20 dark:bg-red-950/20",
        className
      )}>
        
        {/* Header with Title and Priority */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight text-foreground line-clamp-2 break-words">
              {task.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge 
              variant="outline"
              className={cn("text-xs font-medium px-2 py-1 border", getPriorityColor(task.priority))}
            >
              {task.priority}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="h-8 w-8 p-0 hover:bg-primary/10"
            >
              <Eye className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="bg-muted/20 rounded-md p-3 border-l-2 border-border/30">
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">{formatDeadline(new Date(task.deadline))}</span>
            {isOverdue && (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-red-500 ml-auto" />
                <span className="text-red-500 font-medium">Overdue</span>
              </>
            )}
          </div>

          {(task.assignedToName || task.assignedToNames?.length) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50/80 dark:bg-blue-950/60 px-3 py-2 rounded-md">
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-medium">
                {task.assignedToNames?.length > 1 
                  ? `${task.assignedToNames[0]} +${task.assignedToNames.length - 1}`
                  : task.assignedToName || task.assignedToNames?.[0] || "Assigned"
                }
              </span>
            </div>
          )}
        </div>

        {/* Status Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/30">
          {(['To Do', 'In Progress', 'Completed'] as TaskStatus[]).map((status) => (
            <Button
              key={status}
              variant={task.status === status ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(status)}
              disabled={isUpdating || task.status === status}
              className="flex-1 text-xs mobile-touch-target"
            >
              {isUpdating ? '...' : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile Task Detail Dialog */}
      <MobileTaskDetailDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        task={task}
        onEdit={(task) => {
          // TODO: Handle edit
          setShowDetails(false);
          toast.info('Edit functionality coming soon');
        }}
        onDelete={(taskId) => {
          setShowDetails(false);
        }}
      />
    </>
  );
};

export default EnhancedTaskCard;
