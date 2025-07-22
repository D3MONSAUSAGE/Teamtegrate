import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  User, 
  Edit, 
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { format } from 'date-fns';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import UniversalDialog from './UniversalDialog';

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onOpenComments?: (task: Task) => void;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  open,
  onOpenChange,
  task,
  onEdit,
  onDelete,
  onOpenComments
}) => {
  const { updateTaskStatus, deleteTask } = useTask();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!task) return null;

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'To Do':
        return { 
          color: 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
          icon: Clock
        };
      case 'In Progress':
        return { 
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-600',
          icon: Clock
        };
      case 'Completed':
        return { 
          color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-600',
          icon: CheckCircle2
        };
      default:
        return { 
          color: 'bg-muted text-muted-foreground border-border',
          icon: Clock
        };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-600';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-600';
      case 'low':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-600';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;

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

  const handleDelete = async () => {
    if (isUpdating) return;
    
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setIsUpdating(true);
    try {
      await deleteTask(task.id);
      toast.success('Task deleted');
      onOpenChange(false);
      onDelete?.(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <UniversalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={task.title}
      description="Task details and actions"
      variant="sheet"
    >
      <div className="flex flex-col min-h-0">
        <div className="px-6 py-6 space-y-6 flex-1 min-h-0">
          {/* Status and Priority Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={cn("px-4 py-2 font-semibold flex items-center gap-2 border", statusConfig.color)}>
              <StatusIcon className="h-4 w-4" />
              {task.status}
            </Badge>
            <Badge className={cn("px-4 py-2 font-semibold border", getPriorityColor(task.priority))}>
              {task.priority} Priority
            </Badge>
            {isOverdue && (
              <Badge className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-600 font-semibold flex items-center gap-2 border">
                <AlertTriangle className="h-4 w-4" />
                Overdue
              </Badge>
            )}
          </div>

          {/* Quick Status Change */}
          <div className="grid grid-cols-3 gap-3">
            {(['To Do', 'In Progress', 'Completed'] as TaskStatus[]).map((status) => (
              <Button
                key={status}
                variant={task.status === status ? "default" : "outline"}
                size="lg"
                onClick={() => handleStatusChange(status)}
                disabled={isUpdating || task.status === status}
                className="h-12 text-sm font-medium transition-all duration-200 rounded-2xl"
              >
                {isUpdating ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  status
                )}
              </Button>
            ))}
          </div>

          <Separator className="bg-border/50" />

          {/* Task Information */}
          <div className="space-y-4">
            {task.deadline && (
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-border/30">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Due Date</p>
                  <p className="text-base text-muted-foreground">
                    {format(new Date(task.deadline), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            )}
            
            {task.userId && (
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-border/30">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Assigned To</p>
                  <p className="text-base text-muted-foreground">{task.userId}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <>
              <Separator className="bg-border/50" />
              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Description</h4>
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/30">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-6 border-t border-border/30 bg-background/95 backdrop-blur flex-shrink-0">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => onEdit?.(task)}
                disabled={isUpdating}
                className="h-14 text-base font-medium rounded-2xl border-2 hover:bg-muted/50 transition-all duration-200"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit Task
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isUpdating}
                className="h-14 text-base font-medium rounded-2xl border-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete
              </Button>
            </div>
            
            {onOpenComments && (
              <Button
                variant="secondary"
                onClick={() => onOpenComments(task)}
                className="w-full h-14 text-base font-medium rounded-2xl transition-all duration-200"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                View Comments
              </Button>
            )}
          </div>
        </div>
      </div>
    </UniversalDialog>
  );
};

export default TaskDetailDialog;
