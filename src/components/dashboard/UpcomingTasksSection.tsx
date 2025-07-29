import React, { useState } from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { cn } from "@/lib/utils";
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';
import { isTaskOverdue } from '@/utils/taskUtils';

interface UpcomingTasksSectionProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

const UpcomingTasksSection: React.FC<UpcomingTasksSectionProps> = ({
  tasks,
  onCreateTask,
  onEditTask
}) => {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High': return 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20';
      case 'Medium': return 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20';
      case 'Low': return 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20';
      default: return 'border-border bg-muted/30';
    }
  };

  const getPriorityDot = (priority: string) => {
    switch(priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-amber-500';
      case 'Low': return 'bg-blue-500';
      default: return 'bg-muted-foreground';
    }
  };

  const getDateVariant = (task: Task) => {
    const taskDate = new Date(task.deadline);
    const isTodayTask = isToday(taskDate);
    const isTomorrowTask = isTomorrow(taskDate);
    const isOverdue = isTaskOverdue(task);
    
    if (isOverdue) return { variant: 'destructive' as const, text: 'Overdue' };
    if (isTodayTask) return { variant: 'destructive' as const, text: 'Today' };
    if (isTomorrowTask) return { variant: 'secondary' as const, text: 'Tomorrow' };
    
    const daysUntil = differenceInDays(taskDate, new Date());
    if (daysUntil <= 3) return { variant: 'secondary' as const, text: `${daysUntil}d` };
    
    return { variant: 'outline' as const, text: format(taskDate, 'MMM dd') };
  };

  return (
    <>
      <Card className="w-full border-0 shadow-lg bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Upcoming Tasks</CardTitle>
              <p className="text-sm text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? 's' : ''} ahead</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCreateTask}
            className="hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </CardHeader>
        
        <CardContent className="pt-0">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-6 h-40 text-center">
              <div className="p-4 rounded-full bg-primary/5">
                <CheckCircle2 className="h-8 w-8 text-primary/60" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  No upcoming tasks. Ready to tackle something new?
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCreateTask}
                className="hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const dateInfo = getDateVariant(task);
                const isUrgent = dateInfo.variant === 'destructive';
                
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "group relative p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer",
                      getPriorityColor(task.priority),
                      isUrgent && "animate-pulse"
                    )}
                    onClick={() => onEditTask(task)}
                  >
                    {/* Priority indicator dot */}
                    <div className={cn("absolute top-2 left-2 w-2 h-2 rounded-full", getPriorityDot(task.priority))} />
                    
                    <div className="ml-4 space-y-3">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Badge variant={dateInfo.variant} className="text-xs font-medium">
                            {dateInfo.text}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      
                      {/* Footer row */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-3">
                          {task.priority && (
                            <div className="flex items-center space-x-1">
                              <div className={cn("w-1.5 h-1.5 rounded-full", getPriorityDot(task.priority))} />
                              <span>{task.priority} Priority</span>
                            </div>
                          )}
                          
                          {task.assignedToName && (
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{task.assignedToName}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(task.deadline), 'h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <EnhancedCreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        onTaskComplete={() => setIsCreateTaskOpen(false)}
      />
    </>
  );
};

export default UpcomingTasksSection;
