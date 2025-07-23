
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  Edit, 
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { format } from 'date-fns';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import SimplifiedDialogWrapper from './SimplifiedDialogWrapper';
import TaskTimer from '@/components/task/TaskTimer';

interface CleanTaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const CleanTaskDetailDialog: React.FC<CleanTaskDetailDialogProps> = ({
  open,
  onOpenChange,
  task,
  onEdit,
  onDelete
}) => {
  const { updateTaskStatus, deleteTask } = useTask();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newComment, setNewComment] = useState('');

  if (!task) return null;

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'To Do':
        return 'bg-muted text-muted-foreground';
      case 'In Progress':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      case 'Completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      default:
        return 'bg-muted text-muted-foreground';
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
    <SimplifiedDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={task.title}
      description="Task details and actions"
    >
      <div className="p-6 space-y-6">
        {/* Status and Priority */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("font-medium", getStatusColor(task.status))}>
            {task.status}
          </Badge>
          <Badge className={cn("font-medium", getPriorityColor(task.priority))}>
            {task.priority} Priority
          </Badge>
          {isOverdue && (
            <Badge className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>

        {/* Quick Status Actions */}
        <div className="grid grid-cols-3 gap-2">
          {(['To Do', 'In Progress', 'Completed'] as TaskStatus[]).map((status) => (
            <Button
              key={status}
              variant={task.status === status ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(status)}
              disabled={isUpdating || task.status === status}
              className="text-xs"
            >
              {isUpdating ? '...' : status}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Meta Information */}
        <div className="space-y-3">
          {task.deadline && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Due {format(new Date(task.deadline), 'MMM dd, yyyy')}</span>
            </div>
          )}
          
          {task.userId && (
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Assigned to {task.userId}</span>
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

        {/* Timer */}
        <Separator />
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Tracking
          </h4>
          <TaskTimer 
            taskId={task.id} 
            taskTitle={task.title}
            compact={false}
            showControls={true}
          />
        </div>

        {/* Comments */}
        <Separator />
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Add Comment
          </h4>
          <div className="space-y-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              rows={3}
            />
            <Button
              onClick={() => {
                if (newComment.trim()) {
                  // TODO: Add comment functionality
                  setNewComment('');
                  toast.success('Comment added');
                }
              }}
              disabled={!newComment.trim() || isUpdating}
              size="sm"
              className="w-full"
            >
              Add Comment
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <Separator />
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onEdit?.(task)}
            disabled={isUpdating}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isUpdating}
            className="flex-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </SimplifiedDialogWrapper>
  );
};

export default CleanTaskDetailDialog;
