
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { format } from 'date-fns';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileOptimizedDialog from '@/components/mobile/MobileOptimizedDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TaskTimerDialog from '@/components/task/TaskTimerDialog';
import { useTaskDetailHelpers } from '@/components/task/hooks/useTaskDetailHelpers';

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
  const [newComment, setNewComment] = useState('');
  const isMobile = useIsMobile();

  if (!task) return null;

  const {
    getStatusColor,
    getPriorityColor,
    isOverdue,
    formatDate,
    formatTime,
    getAssignedToName,
  } = useTaskDetailHelpers(task);

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

  const dialogContent = (
    <div className="space-y-4 lg:space-y-6">
      {/* Task Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
            {task.priority && (
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority} Priority
              </Badge>
            )}
          </div>

          {task.deadline && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Calendar className="h-4 w-4" />
              <span>Due: {formatDate(new Date(task.deadline))}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <User className="h-4 w-4" />
            <span>Assigned to: {getAssignedToName()}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(task)}
              disabled={isUpdating}
              className="mobile-touch-target"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isUpdating}
              className="text-red-600 hover:text-red-700 mobile-touch-target"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>

          {/* Status Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
      </div>

      {/* Timer Section */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracking
        </h3>
        <TaskTimerDialog 
          taskId={task.id} 
          taskTitle={task.title}
        />
      </div>

      {/* Description */}
      {task.description && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
              {task.description}
            </p>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </h3>
        
        <div className="space-y-4">
          <div className="flex flex-col gap-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mobile-touch-target min-h-[80px]"
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
              className="mobile-touch-target w-full sm:w-auto sm:self-start"
            >
              Add Comment
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">
            No comments yet. Be the first to add one!
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileOptimizedDialog
        open={open}
        onOpenChange={onOpenChange}
        title={task.title}
        description={`${task.status} • ${task.priority} Priority`}
        className="max-h-[90vh] overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-6">
          {dialogContent}
        </div>
      </MobileOptimizedDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-md lg:max-w-2xl 
                                 h-[90vh] sm:h-auto sm:max-h-[90vh] 
                                 fixed inset-x-2 top-4 bottom-4 sm:inset-auto 
                                 sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]
                                 overflow-hidden flex flex-col
                                 rounded-t-2xl sm:rounded-lg">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b">
          <DialogTitle className="text-lg sm:text-xl font-semibold pr-8 line-clamp-2">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {dialogContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
