
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  User, 
  Edit, 
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle
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
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  open,
  onOpenChange,
  task,
  onEdit,
  onDelete
}) => {
  const { updateTaskStatus, deleteTask } = useTask();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!task) return null;

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'To Do':
        return { 
          color: 'bg-muted text-muted-foreground',
          icon: Clock
        };
      case 'In Progress':
        return { 
          color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
          icon: Clock
        };
      case 'Completed':
        return { 
          color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
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
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300';
      case 'low':
        return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300';
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
    <UniversalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={task.title}
      description="Task details and actions"
      variant="sheet"
    >
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Status and Priority Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("font-medium flex items-center gap-1", statusConfig.color)}>
              <StatusIcon className="h-3 w-3" />
              {task.status}
            </Badge>
            <Badge className={cn("font-medium", getPriorityColor(task.priority))}>
              {task.priority} Priority
            </Badge>
            {isOverdue && (
              <Badge className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
          </div>

          {/* Quick Status Change */}
          <div className="grid grid-cols-3 gap-2">
            {(['To Do', 'In Progress', 'Completed'] as TaskStatus[]).map((status) => (
              <Button
                key={status}
                variant={task.status === status ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange(status)}
                disabled={isUpdating || task.status === status}
                className="h-10 text-sm"
              >
                {isUpdating ? '...' : status}
              </Button>
            ))}
          </div>

          <Separator />

          {/* Task Information */}
          <div className="space-y-4">
            {task.deadline && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(task.deadline), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            )}
            
            {task.userId && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Assigned To</p>
                  <p className="text-sm text-muted-foreground">{task.userId}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onEdit?.(task)}
              disabled={isUpdating}
              className="flex-1 h-12"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isUpdating}
              className="flex-1 h-12 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </ScrollArea>
    </UniversalDialog>
  );
};

export default TaskDetailDialog;
