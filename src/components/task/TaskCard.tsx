
import React from 'react';
import { Clock, AlertCircle, User, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import TaskTimer from './TaskTimer';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, className }) => {
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-destructive text-destructive-foreground';
      case 'Medium': return 'bg-warning text-warning-foreground';
      case 'Low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-success';
      case 'In Progress': return 'text-primary';
      case 'To Do': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 relative",
        isOverdue && "border-destructive/50 bg-destructive/5",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          
          <Badge variant="outline" className={cn("text-xs flex-shrink-0", getPriorityColor(task.priority))}>
            {task.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Main info row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(task.deadline).toLocaleDateString()}</span>
          </div>
          
          {task.cost && task.cost > 0 && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>${task.cost}</span>
            </div>
          )}
        </div>

        {/* Timer - minimal integration */}
        <TaskTimer 
          taskId={task.id}
          taskTitle={task.title}
          compact={true}
          showControls={false}
          className="justify-end"
        />

        {/* Bottom row with assignee and status */}
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 flex-1">
            {(task.assignedToNames && task.assignedToNames.length > 0) && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate max-w-20">
                  {task.assignedToNames[0]}
                  {task.assignedToNames.length > 1 && ` +${task.assignedToNames.length - 1}`}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge 
              variant="outline" 
              className={cn("text-xs", getStatusColor(task.status))}
            >
              {task.status}
            </Badge>
            
            {/* Overdue badge positioned absolutely in bottom right */}
            {isOverdue && (
              <Badge 
                variant="destructive" 
                className="text-xs absolute -bottom-2 -right-2 shadow-lg"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
