
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, MessageSquare, Edit, Trash2, X } from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { format } from 'date-fns';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import TaskTimer from '@/components/task/TaskTimer';

interface MobileTaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const MobileTaskDetailDialog: React.FC<MobileTaskDetailDialogProps> = ({
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

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'To Do':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      toast.success('Task status updated successfully');
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
      toast.success('Task deleted successfully');
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-md lg:max-w-2xl 
                                 h-[95vh] sm:h-auto sm:max-h-[90vh] 
                                 fixed inset-x-2 top-2 bottom-2 sm:inset-auto 
                                 sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]
                                 overflow-hidden flex flex-col
                                 p-0 rounded-t-2xl sm:rounded-lg">
        
        {/* Mobile Header with Close Button */}
        <div className="flex-shrink-0 bg-background border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-semibold pr-2 line-clamp-2">
                {task.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
                {task.priority && (
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority} Priority
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Task Meta Info */}
          <div className="grid grid-cols-1 gap-4">
            {task.deadline && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <Calendar className="h-4 w-4" />
                <span>Due: {format(new Date(task.deadline), 'MMM dd, yyyy')}</span>
              </div>
            )}

            {task.userId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <User className="h-4 w-4" />
                <span>Assigned to: {task.userId}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(task)}
                disabled={isUpdating}
                className="flex-1 mobile-touch-target"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isUpdating}
                className="flex-1 text-red-600 hover:text-red-700 mobile-touch-target"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            {/* Status Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              {(['To Do', 'In Progress', 'Completed'] as TaskStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={task.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdating || task.status === status}
                  className="text-xs mobile-touch-target"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Timer Section */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Tracking
            </h3>
            <TaskTimer 
              taskId={task.id} 
              taskTitle={task.title}
              compact={false}
              showControls={true}
            />
          </div>

          {/* Description */}
          {task.description && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-base font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                {task.description}
              </p>
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] mobile-touch-target"
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
                  className="mobile-touch-target w-full"
                >
                  Add Comment
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Be the first to add one!
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileTaskDetailDialog;
