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

const getPriorityStyles = (priority: string) => {
  switch(priority) {
    case 'High': 
      return {
        gradient: '[background:var(--task-gradient-high)]',
        glow: 'shadow-lg hover:shadow-xl shadow-red-500/10 hover:shadow-red-500/20',
        border: 'border-red-200/30 dark:border-red-800/30 hover:border-red-300/50 dark:hover:border-red-700/50',
        dot: 'bg-red-500'
      };
    case 'Medium': 
      return {
        gradient: '[background:var(--task-gradient-medium)]',
        glow: 'shadow-lg hover:shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20',
        border: 'border-amber-200/30 dark:border-amber-800/30 hover:border-amber-300/50 dark:hover:border-amber-700/50',
        dot: 'bg-amber-500'
      };
    case 'Low': 
      return {
        gradient: '[background:var(--task-gradient-low)]',
        glow: 'shadow-lg hover:shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20',
        border: 'border-blue-200/30 dark:border-blue-800/30 hover:border-blue-300/50 dark:hover:border-blue-700/50',
        dot: 'bg-blue-500'
      };
    default: 
      return {
        gradient: '[background:var(--task-gradient-default)]',
        glow: 'shadow-lg hover:shadow-xl shadow-gray-500/10 hover:shadow-gray-500/20',
        border: 'border-border/50 hover:border-border',
        dot: 'bg-gray-400'
      };
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
  maxHeight = "400px"
}) => {
  // Helper function to check task states for professional styling
  const getTaskState = (task: DailyTaskDetail) => {
    const isCompleted = task.status === 'Completed';
    
    // Simple overdue check
    const isOverdue = !isCompleted && task.deadline && new Date(task.deadline) < new Date();
    
    // Simple warning check (24 hours before deadline by default)
    const warningHours = task.warning_period_hours || 24;
    const warningTime = new Date();
    warningTime.setHours(warningTime.getHours() + warningHours);
    const isWarning = !isCompleted && !isOverdue && task.deadline && new Date(task.deadline) <= warningTime;

    return { isCompleted, isOverdue, isWarning };
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3 flex-shrink-0">
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
      <CardContent className="pt-0 flex-1 flex flex-col min-h-0">
        {tasks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8 text-sm text-muted-foreground">
              <div className="mb-2 opacity-50">📋</div>
              {emptyMessage}
            </div>
          </div>
        ) : (
          <div 
            className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent"
            style={{ maxHeight }}
          >
            {tasks.map((task) => {
              const { isCompleted, isOverdue, isWarning } = getTaskState(task);
              const priorityStyles = getPriorityStyles(task.priority);

              return (
                <div
                  key={task.task_id}
                  className={cn(
                    "group relative overflow-hidden border rounded-xl transition-all duration-300 ease-out",
                    "hover:scale-[1.02] hover:-translate-y-0.5",
                    "backdrop-blur-sm p-4",
                    onTaskClick && "cursor-pointer",
                    
                    // Professional styling based on task state
                    // Completed state (green glow) - takes precedence
                    isCompleted && [
                      "ring-2 ring-green-500/40 shadow-xl shadow-green-500/20",
                      "[background:linear-gradient(135deg,hsl(142_76%_36%/0.1),hsl(142_69%_58%/0.15),hsl(142_76%_36%/0.08))]",
                      "border-green-400/60 dark:border-green-500/50"
                    ],
                    
                    // Overdue state (red glow) - takes precedence over priority
                    !isCompleted && isOverdue && [
                      "ring-2 ring-red-500/40 shadow-xl shadow-red-500/20",
                      "[background:linear-gradient(135deg,hsl(0_84%_60%/0.1),hsl(15_78%_65%/0.15),hsl(0_84%_60%/0.08))]",
                      "border-red-400/60 dark:border-red-500/50",
                      "animate-pulse"
                    ],
                    
                    // Warning state (amber glow) - priority over normal priority
                    !isCompleted && !isOverdue && isWarning && [
                      "ring-2 ring-amber-500/40 shadow-xl shadow-amber-500/20",
                      "[background:linear-gradient(135deg,hsl(45_93%_47%/0.1),hsl(48_89%_50%/0.15),hsl(45_93%_47%/0.08))]",
                      "border-amber-400/60 dark:border-amber-500/50",
                      "animate-pulse"
                    ],
                    
                    // Normal priority-based styling
                    !isCompleted && !isOverdue && !isWarning && [
                      priorityStyles.gradient,
                      priorityStyles.border,
                      priorityStyles.glow
                    ]
                  )}
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title with status indicator */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {/* Priority dot */}
                          <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            isCompleted ? "bg-green-500" :
                            isOverdue ? "bg-red-500 animate-pulse" :
                            isWarning ? "bg-amber-500 animate-pulse" :
                            priorityStyles.dot
                          )} />
                          {getStatusIcon(task.status)}
                        </div>
                        <p className="font-semibold text-sm truncate">{task.title}</p>
                        
                        {/* Status badges */}
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5 animate-pulse">
                            OVERDUE
                          </Badge>
                        )}
                        {!isOverdue && isWarning && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 animate-pulse">
                            DUE SOON
                          </Badge>
                        )}
                      </div>
                      
                      {/* Project info */}
                      {task.project_title && (
                        <p className="text-xs text-muted-foreground mb-2 truncate flex items-center gap-1">
                          <span className="text-muted-foreground/60">📁</span>
                          {task.project_title}
                        </p>
                      )}
                      
                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-3 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Footer with priority, completion time, and deadline */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getPriorityColor(task.priority)} 
                            className="text-xs px-2 py-0.5 font-medium"
                          >
                            {task.priority}
                          </Badge>
                          {task.completed_at && (
                            <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {format(new Date(task.completed_at), 'HH:mm')}
                            </span>
                          )}
                        </div>
                        
                        {task.deadline && (
                          <span className={cn(
                            "text-xs flex items-center gap-1 px-2 py-1 rounded-md",
                            isOverdue ? "text-red-600 bg-red-50 dark:bg-red-950/30 font-medium" :
                            isWarning ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30 font-medium" :
                            "text-muted-foreground bg-muted/30"
                          )}>
                            <Clock className="w-3 h-3" />
                            {format(new Date(task.deadline), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action button */}
                    {onTaskClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 h-8 w-8 p-0 hover:bg-background/50 backdrop-blur-sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};