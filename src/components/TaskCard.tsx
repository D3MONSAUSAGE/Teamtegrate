
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, TaskStatus } from '@/types';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Clock, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from 'lucide-react';
import { useTask } from '@/contexts/TaskContext';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onAssign?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onAssign }) => {
  const { updateTaskStatus, deleteTask } = useTask();
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Low': return 'priority-low';
      case 'Medium': return 'priority-medium';
      case 'High': return 'priority-high';
      default: return 'priority-low';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'To Do': return 'status-todo';
      case 'In Progress': return 'status-inprogress';
      case 'Pending': return 'status-pending';
      case 'Completed': return 'status-completed';
      default: return 'status-todo';
    }
  };
  
  const handleStatusChange = (status: TaskStatus) => {
    updateTaskStatus(task.id, status);
  };
  
  const isTaskOverdue = () => {
    const now = new Date();
    return task.status !== 'Completed' && task.deadline < now;
  };
  
  return (
    <Card className={cn("card-hover", isTaskOverdue() && "border-red-500")}>
      <CardHeader className="pb-1 md:pb-2 flex flex-row justify-between items-start">
        <div className="min-w-0">
          <CardTitle className="text-sm md:text-base truncate">{task.title}</CardTitle>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
          <Badge className={cn(getPriorityColor(task.priority), "text-xs md:text-sm px-1.5 py-0.5")}>
            {task.priority}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs md:text-sm">
              <DropdownMenuItem onClick={() => onEdit && onEdit(task)}>
                Edit
              </DropdownMenuItem>
              {onAssign && (
                <DropdownMenuItem onClick={() => onAssign(task)}>
                  Assign Member
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleStatusChange('To Do')}>
                Mark as To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('In Progress')}>
                Mark as In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('Pending')}>
                Mark as Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('Completed')}>
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-500" 
                onClick={() => deleteTask(task.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 md:pt-1 px-4 md:px-6 pb-4">
        <p className="text-xs md:text-sm text-gray-600 line-clamp-2">{task.description}</p>
        
        <div className="flex items-center justify-between pt-1 md:pt-2">
          <div className="flex items-center text-xs text-gray-500 gap-1">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {format(task.deadline, 'MMM d')} at {format(task.deadline, 'h:mm a')}
            </span>
          </div>
          
          {task.assignedToName && (
            <div className="flex items-center text-xs text-gray-500 gap-1">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[100px]">{task.assignedToName}</span>
            </div>
          )}
        </div>
        
        <div className="pt-1 md:pt-2 flex flex-wrap gap-1">
          <Badge className={cn(getStatusColor(task.status), "text-xs md:text-sm")}>
            {task.status}
          </Badge>
          {isTaskOverdue() && (
            <Badge variant="destructive" className="ml-1 text-xs md:text-sm">
              Overdue
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
