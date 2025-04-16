
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
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
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
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-base">{task.title}</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit && onEdit(task)}>
                Edit
              </DropdownMenuItem>
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
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center text-xs text-gray-500 gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {format(task.deadline, 'MMM d')} at {format(task.deadline, 'h:mm a')}
            </span>
          </div>
          
          {task.assignedToName && (
            <div className="flex items-center text-xs text-gray-500 gap-1">
              <User className="h-3 w-3" />
              <span>{task.assignedToName}</span>
            </div>
          )}
        </div>
        
        <div className="pt-2">
          <Badge className={getStatusColor(task.status)}>
            {task.status}
          </Badge>
          {isTaskOverdue() && (
            <Badge variant="destructive" className="ml-2">
              Overdue
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
