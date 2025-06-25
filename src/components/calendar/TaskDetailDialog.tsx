
import React from 'react';
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  CalendarIcon, 
  Clock, 
  AlertCircle, 
  MessageCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import TaskCommentForm from "@/components/TaskCommentForm";
import TaskCommentsList from "@/components/TaskCommentsList";
import { useTaskDetailUtils } from './task-detail/useTaskDetailUtils';
import { format } from 'date-fns';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  task,
  open,
  onOpenChange
}) => {
  const { updateTaskStatus } = useTask();

  if (!task) return null;
  
  const {
    getStatusColor,
    getPriorityColor,
    isOverdue,
    formatDate,
    formatTime
  } = useTaskDetailUtils(task);

  const handleStatusChange = (status: 'To Do' | 'In Progress' | 'Completed') => {
    updateTaskStatus(task.id, status);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-semibold">
            <span className="mr-2 flex-1">{task.title}</span>
            <Badge className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        {/* Task Description */}
        <div className="mt-4">
          <div className="text-sm text-muted-foreground whitespace-pre-line px-3 py-2 rounded bg-muted border">
            {task.description || <em className="text-xs text-gray-400">No description provided.</em>}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Task Meta Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">
              {formatDate(task.deadline)}
            </span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">
              {formatTime(task.deadline)}
            </span>
          </div>
          
          <div>
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority} Priority
            </Badge>
          </div>
          
          {isOverdue && (
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-rose-500" />
              <span className="text-sm text-rose-500 font-medium">
                Overdue
              </span>
            </div>
          )}
          
          {task.assignedToName && (
            <div className="col-span-2 text-sm">
              <span className="text-muted-foreground">Assigned to: </span>
              <span className="font-medium">{task.assignedToName}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Comments Section */}
        <div className="space-y-4">
          <div className="font-medium text-sm flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            Comments
          </div>
          
          {task.comments && task.comments.length > 0 ? (
            <TaskCommentsList 
              taskComments={task.comments} 
              className="max-h-48 overflow-y-auto" 
            />
          ) : (
            <div className="text-sm text-muted-foreground">No comments yet</div>
          )}
          
          <TaskCommentForm taskId={task.id} />
        </div>

        <Separator className="my-4" />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          {task.status !== 'Completed' && (
            <Button 
              onClick={() => handleStatusChange('Completed')} 
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
          
          {task.status === 'Completed' && (
            <Button
              onClick={() => handleStatusChange('To Do')}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Mark Incomplete
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;
