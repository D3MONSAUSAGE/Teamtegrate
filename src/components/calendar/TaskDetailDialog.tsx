
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  Play,
  Square,
  Repeat,
  MessageSquare,
  AlertCircle,
  Edit
} from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';
import TaskTimer from '@/components/task/TaskTimer';
import { useTaskTimeTracking } from '@/hooks/useTaskTimeTracking';
import { useTask } from '@/contexts/task';
import { toast } from 'sonner';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (task: Task) => void;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  task,
  open,
  onOpenChange,
  onEdit
}) => {
  const { updateTaskStatus } = useTask();
  const { timerState, startTaskWork, stopTaskWork, isLoading: timerLoading } = useTaskTimeTracking();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [comment, setComment] = useState('');

  if (!task) return null;

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';
  const isActiveTimer = timerState.activeTaskId === task.id;
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'border-red-200 bg-red-50 text-red-800';
      case 'Medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'Low': return 'border-green-200 bg-green-50 text-green-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'In Progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'To Do': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleStartWorking = async () => {
    try {
      setIsUpdatingStatus(true);
      
      // Update task status to In Progress if not already
      if (task.status !== 'In Progress') {
        await updateTaskStatus(task.id, 'In Progress');
      }
      
      // Start the task timer
      await startTaskWork(task.id, task.title);
      
      toast.success('Started working on task');
    } catch (error) {
      console.error('Error starting work:', error);
      toast.error('Failed to start working on task');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStopWorking = async () => {
    try {
      await stopTaskWork();
    } catch (error) {
      console.error('Error stopping work:', error);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      setIsUpdatingStatus(true);
      
      // If stopping work (changing from In Progress), stop the timer
      if (task.status === 'In Progress' && newStatus !== 'In Progress' && isActiveTimer) {
        await stopTaskWork();
      }
      
      await updateTaskStatus(task.id, newStatus);
      toast.success(`Task status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-4">
            <span className="flex-1 text-xl font-bold leading-tight">
              {task.title}
            </span>
            <div className="flex gap-2 shrink-0">
              <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                {task.priority}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Timer Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Time Tracking</h3>
            <TaskTimer 
              taskId={task.id}
              taskTitle={task.title}
              compact={false}
              showControls={false}
              className="bg-background border"
            />
          </div>

          {/* Status and Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={cn("text-xs", getStatusColor(task.status))}>
                  {task.status}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                {task.status !== 'In Progress' && !isActiveTimer && (
                  <Button
                    onClick={handleStartWorking}
                    disabled={isUpdatingStatus || timerLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Working
                  </Button>
                )}
                
                {isActiveTimer && (
                  <Button
                    variant="destructive"
                    onClick={handleStopWorking}
                    disabled={timerLoading}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Working
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Status Change Buttons */}
            <div className="flex gap-2 flex-wrap">
              {(['To Do', 'In Progress', 'Completed'] as TaskStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={task.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdatingStatus || task.status === status}
                  className="text-xs"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Task Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Task Details</h3>
            
            {task.description && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md">
                  {task.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Deadline
                </Label>
                <p className="text-sm">
                  {new Date(task.deadline).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {task.cost && task.cost > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Budget
                  </Label>
                  <p className="text-sm font-medium">${task.cost}</p>
                </div>
              )}
            </div>

            {task.assignedToNames && task.assignedToNames.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Assigned To
                </Label>
                <div className="flex flex-wrap gap-1">
                  {task.assignedToNames.map((name, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(task)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Recurring tasks feature coming soon!')}
              >
                <Repeat className="h-4 w-4 mr-2" />
                Make Recurring
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
