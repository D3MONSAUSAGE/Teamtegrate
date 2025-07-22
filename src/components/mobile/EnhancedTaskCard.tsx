
import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { Eye, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import CleanTaskDetailDialog from './CleanTaskDetailDialog';

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
      case 'Low': return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300';
      case 'Medium': return 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300';
      case 'High': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
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
        "bg-card rounded-xl border p-4 space-y-4",
        "shadow-sm hover:shadow-md transition-all duration-200",
        "touch-manipulation",
        isOverdue && "ring-2 ring-red-200 dark:ring-red-800/50",
        className
      )}>
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight line-clamp-2">
              {task.title}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(true)}
            className="h-8 w-8 p-0 rounded-full hover:bg-muted flex-shrink-0"
            aria-label="View task details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-xs font-medium", getPriorityColor(task.priority))}>
            {task.priority}
          </Badge>
          {isOverdue && (
            <Badge className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          </div>
        )}

        {/* Meta Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{formatDeadline(new Date(task.deadline))}</span>
            {isOverdue && (
              <span className="text-red-500 font-semibold ml-auto">
                OVERDUE
              </span>
            )}
          </div>

          {(task.assignedToName || task.assignedToNames?.length) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 flex-shrink-0" />
              <span>
                {task.assignedToNames?.length > 1 
                  ? `${task.assignedToNames[0]} +${task.assignedToNames.length - 1}`
                  : task.assignedToName || task.assignedToNames?.[0] || "Assigned"
                }
              </span>
            </div>
          )}
        </div>

        {/* Status Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {(['To Do', 'In Progress', 'Completed'] as TaskStatus[]).map((status) => (
            <Button
              key={status}
              variant={task.status === status ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(status)}
              disabled={isUpdating || task.status === status}
              className="flex-1 text-xs h-8"
            >
              {isUpdating ? '...' : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Clean Task Detail Dialog */}
      <CleanTaskDetailDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        task={task}
        onEdit={(task) => {
          setShowDetails(false);
          toast.info('Edit functionality will be implemented soon');
        }}
        onDelete={(taskId) => {
          setShowDetails(false);
        }}
      />
    </>
  );
};

export default EnhancedTaskCard;
