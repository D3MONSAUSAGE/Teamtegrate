
import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { Eye, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import ModernTaskDetailDialog from './ModernTaskDetailDialog';

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
        "bg-card rounded-2xl border border-border/60 p-5 space-y-4",
        "shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]",
        "touch-manipulation backdrop-blur-sm",
        isOverdue && "ring-2 ring-red-400/60 bg-gradient-to-br from-red-50/80 to-background dark:from-red-950/20 dark:to-background",
        className
      )}>
        
        {/* Header with Title and View Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight text-foreground line-clamp-2 break-words">
              {task.title}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(true)}
            className="h-10 w-10 p-0 rounded-full hover:bg-primary/10 hover:scale-110 transition-all duration-200 flex-shrink-0"
          >
            <Eye className="h-4 w-4 text-primary" />
          </Button>
        </div>

        {/* Priority and Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="outline"
            className={cn("text-xs font-semibold px-3 py-1.5 border-2", getPriorityColor(task.priority))}
          >
            {task.priority}
          </Badge>
          {isOverdue && (
            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 text-xs font-semibold px-3 py-1.5 border-2">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl p-4 border-l-4 border-primary/30">
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {task.description}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground bg-gradient-to-r from-muted/20 to-transparent px-4 py-3 rounded-xl">
            <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
            <span className="font-semibold">{formatDeadline(new Date(task.deadline))}</span>
            {isOverdue && (
              <span className="text-red-500 font-bold ml-auto">
                OVERDUE
              </span>
            )}
          </div>

          {(task.assignedToName || task.assignedToNames?.length) && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-950/40 px-4 py-3 rounded-xl">
              <User className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">
                {task.assignedToNames?.length > 1 
                  ? `${task.assignedToNames[0]} +${task.assignedToNames.length - 1}`
                  : task.assignedToName || task.assignedToNames?.[0] || "Assigned"
                }
              </span>
            </div>
          )}
        </div>

        {/* Status Actions */}
        <div className="flex gap-2 pt-4 border-t border-border/30">
          {(['To Do', 'In Progress', 'Completed'] as TaskStatus[]).map((status) => (
            <Button
              key={status}
              variant={task.status === status ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(status)}
              disabled={isUpdating || task.status === status}
              className={cn(
                "flex-1 text-xs h-10 font-semibold transition-all duration-200",
                task.status === status && "shadow-md bg-gradient-to-r from-primary to-primary/80"
              )}
            >
              {isUpdating ? (
                <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                status
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Modern Task Detail Dialog */}
      <ModernTaskDetailDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        task={task}
        onEdit={(task) => {
          // TODO: Handle edit
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
