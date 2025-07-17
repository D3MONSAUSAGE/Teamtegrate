
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
        "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20",
        isOverdue && "border-destructive/50 bg-destructive/5",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-1 ml-2">
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Task Timer - shows active timer or total time */}
        <TaskTimer 
          taskId={task.id}
          taskTitle={task.title}
          compact={true}
          showControls={false}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(task.deadline).toLocaleDateString()}
              </span>
            </div>
            
            {task.cost && task.cost > 0 && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>${task.cost}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(task.assignedToNames && task.assignedToNames.length > 0) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate max-w-20">
                  {task.assignedToNames[0]}
                  {task.assignedToNames.length > 1 && ` +${task.assignedToNames.length - 1}`}
                </span>
              </div>
            )}
            
            <Badge 
              variant="outline" 
              className={cn("text-xs", getStatusColor(task.status))}
            >
              {task.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
