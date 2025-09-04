
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import TaskTimerDialog from '@/components/task/TaskTimerDialog';
import { useTaskDetailHelpers } from '@/components/task/hooks/useTaskDetailHelpers';
import TaskDetailComments from './task-detail/TaskDetailComments';

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onUpdateTaskStatus?: (taskId: string, status: Task['status']) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  open,
  onOpenChange,
  task,
  onEdit,
  onDelete,
  onUpdateTaskStatus,
  onDeleteTask
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  if (!task) return null;

  const { getAssignedToName } = useTaskDetailHelpers(task);

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
    if (isUpdating || !onUpdateTaskStatus) return;
    
    setIsUpdating(true);
    try {
      await onUpdateTaskStatus(task.id, newStatus);
      toast.success('Task status updated successfully');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isUpdating || !onDeleteTask) return;
    
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    setIsUpdating(true);
    try {
      await onDeleteTask(task.id);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold pr-8">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {format(new Date(task.deadline), 'MMM dd, yyyy')}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Assigned to: {getAssignedToName()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(task)}
                  disabled={isUpdating}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isUpdating}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>

              {/* Status Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {(['To Do', 'In Progress', 'Completed'] as TaskStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={task.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    disabled={isUpdating || task.status === status}
                    className="text-xs"
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
              <p className="text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Comments Section */}
          <TaskDetailComments 
            taskId={task.id} 
            comments={task.comments} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
