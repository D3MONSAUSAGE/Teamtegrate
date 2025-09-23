import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, AlertTriangle, Clock, CheckCircle, Target } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DailyTaskDetail } from '@/components/reports/weekly/DailyTaskDetailView';

interface ScrollableTaskContainerProps {
  title: string;
  tasks: DailyTaskDetail[];
  icon: React.ReactNode;
  emptyMessage?: string;
  onTaskClick?: (task: DailyTaskDetail) => void;
  className?: string;
  maxHeight?: string;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'destructive';
    case 'Medium': return 'default';
    case 'Low': return 'secondary';
    default: return 'outline';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed': return <CheckCircle className="h-3 w-3 text-success" />;
    case 'In Progress': return <Clock className="h-3 w-3 text-primary" />;
    case 'To Do': return <Target className="h-3 w-3 text-muted-foreground" />;
    default: return <AlertTriangle className="h-3 w-3 text-warning" />;
  }
};

export const ScrollableTaskContainer: React.FC<ScrollableTaskContainerProps> = ({
  title,
  tasks,
  icon,
  emptyMessage = "No tasks found",
  onTaskClick,
  className,
  maxHeight = "300px"
}) => {
  return (
    <Card className={cn("h-fit", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          <Badge variant="outline" className="text-xs">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div 
            className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            style={{ maxHeight }}
          >
            {tasks.map((task) => (
              <div
                key={task.task_id}
                className={cn(
                  "group p-3 border rounded-lg transition-all hover:shadow-sm hover:border-primary/20",
                  onTaskClick && "cursor-pointer"
                )}
                onClick={() => onTaskClick?.(task)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(task.status)}
                      <p className="font-medium text-sm truncate">{task.title}</p>
                    </div>
                    
                    {task.project_title && (
                      <p className="text-xs text-muted-foreground mb-1 truncate">
                        📁 {task.project_title}
                      </p>
                    )}
                    
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                      {task.completed_at && (
                        <span className="text-xs text-success">
                          ✓ {format(new Date(task.completed_at), 'HH:mm')}
                        </span>
                      )}
                      {task.deadline && (
                        <span className="text-xs text-muted-foreground">
                          📅 {format(new Date(task.deadline), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {onTaskClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};