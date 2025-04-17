
import React from 'react';
import { Task } from '@/types';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useTask } from '@/contexts/task';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle,
  MessageCircle, 
  CheckCircle2, 
  X
} from 'lucide-react';
import TaskCommentForm from '@/components/TaskCommentForm';
import TaskCommentsList from '@/components/TaskCommentsList';
import { Separator } from "@/components/ui/separator";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  open,
  onOpenChange
}) => {
  const { updateTaskStatus } = useTask();

  if (!task) return null;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'To Do': return 'bg-slate-100 hover:bg-slate-200 text-slate-700';
      case 'In Progress': return 'bg-blue-100 hover:bg-blue-200 text-blue-700';
      case 'Pending': return 'bg-amber-100 hover:bg-amber-200 text-amber-700';
      case 'Completed': return 'bg-green-100 hover:bg-green-200 text-green-700';
      default: return '';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Low': return 'bg-blue-100 hover:bg-blue-200 text-blue-700';
      case 'Medium': return 'bg-amber-100 hover:bg-amber-200 text-amber-700';
      case 'High': return 'bg-rose-100 hover:bg-rose-200 text-rose-700';
      default: return '';
    }
  };

  const isOverdue = () => {
    try {
      const now = new Date();
      const deadline = new Date(task.deadline);
      return task.status !== 'Completed' && deadline < now;
    } catch (error) {
      console.error("Invalid deadline date for task:", task.id);
      return false;
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const formattedDate = new Date(date);
      return format(formattedDate, 'MMM d, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      const formattedDate = new Date(date);
      return format(formattedDate, 'h:mm a');
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  const handleStatusChange = (status: 'To Do' | 'In Progress' | 'Pending' | 'Completed') => {
    updateTaskStatus(task.id, status);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-between">
              <span className="mr-2">{task.title}</span>
              <Badge className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground mt-2">
              {task.description}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
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
              
              {isOverdue() && (
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
            
            <div className="space-y-2">
              <div className="font-medium text-sm flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Comments
              </div>
              
              {task.comments && task.comments.length > 0 ? (
                <TaskCommentsList taskComments={task.comments} className="mt-2 max-h-40 overflow-y-auto" />
              ) : (
                <div className="text-sm text-muted-foreground mt-2">No comments yet</div>
              )}
              
              <TaskCommentForm taskId={task.id} />
            </div>
          </div>
          
          <DrawerFooter className="flex flex-row space-x-2">
            {task.status !== 'Completed' && (
              <Button 
                onClick={() => handleStatusChange('Completed')} 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
            
            {task.status === 'Completed' && (
              <Button
                onClick={() => handleStatusChange('To Do')}
                variant="outline"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Mark Incomplete
              </Button>
            )}
            
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TaskDetailDrawer;
