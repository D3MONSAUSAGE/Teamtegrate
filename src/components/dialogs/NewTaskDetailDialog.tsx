
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  CoreDialog,
  CoreDialogContent,
  CoreDialogHeader,
  CoreDialogBody,
  CoreDialogFooter,
  CoreDialogTitle,
  CoreDialogDescription
} from '@/components/ui/core-dialog';

interface NewTaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onOpenComments?: (task: Task) => void;
}

const NewTaskDetailDialog: React.FC<NewTaskDetailDialogProps> = ({
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
          color: 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300',
          icon: Clock
        };
      case 'In Progress':
        return { 
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          icon: Clock
        };
      case 'Completed':
        return { 
          color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
          icon: CheckCircle2
        };
      default:
        return { 
          color: 'bg-muted text-muted-foreground',
          icon: Clock
        };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'low':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
      default:
        return 'bg-muted text-muted-foreground';
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
    <CoreDialog open={open} onOpenChange={onOpenChange}>
      <CoreDialogContent variant="sheet">
        <CoreDialogHeader>
          <CoreDialogTitle>{task.title}</CoreDialogTitle>
          <CoreDialogDescription>Task details and actions</CoreDialogDescription>
        </CoreDialogHeader>

        <CoreDialogBody>
          <div className="space-y-6">
            {/* Status and Priority Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={cn("px-4 py-2 font-semibold flex items-center gap-2", statusConfig.color)}>
                <StatusIcon className="h-4 w-4" />
                {task.status}
              </Badge>
              <Badge className={cn("px-4 py-2 font-semibold", getPriorityColor(task.priority))}>
                {task.priority} Priority
              </Badge>
              {isOverdue && (
                <Badge className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
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
                  className="h-12 text-base font-medium"
                >
                  {isUpdating ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    status
                  )}
                </Button>
              ))}
            </div>

            {/* Task Information */}
            <div className="space-y-4">
              {task.deadline && (
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
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
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
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
              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Description</h4>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CoreDialogBody>

        <CoreDialogFooter>
          <div className="flex flex-col gap-3 w-full">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => onEdit?.(task)}
                disabled={isUpdating}
                className="h-12 text-base font-medium"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isUpdating}
                className="h-12 text-base font-medium text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            
            {onOpenComments && (
              <Button
                variant="secondary"
                onClick={() => onOpenComments(task)}
                className="w-full h-12 text-base font-medium"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                View Comments
              </Button>
            )}
          </div>
        </CoreDialogFooter>
      </CoreDialogContent>
    </CoreDialog>
  );
};

export default NewTaskDetailDialog;
