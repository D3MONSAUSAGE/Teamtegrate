
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { useTask } from '@/contexts/task/TaskContext';
import { Task } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MobileTodaysTasksSectionProps {
  onTaskPress: (task: Task) => void;
  onViewAll: () => void;
}

const MobileTodaysTasksSection: React.FC<MobileTodaysTasksSectionProps> = ({
  onTaskPress,
  onViewAll
}) => {
  const { tasks } = useTask();

  const todaysTasks = tasks.filter(task => {
    const today = new Date();
    const taskDeadline = new Date(task.deadline);
    return taskDeadline.toDateString() === today.toDateString();
  }).slice(0, 3);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20';
      case 'In Progress':
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
      default:
        return 'border-l-gray-300 bg-gray-50/50 dark:bg-gray-950/20';
    }
  };

  if (todaysTasks.length === 0) {
    return (
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Today's Tasks</h2>
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground text-center">No tasks due today</p>
            <p className="text-sm text-muted-foreground/60 text-center">You're all caught up!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Today's Tasks</h2>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-3">
        {todaysTasks.map((task) => (
          <Card
            key={task.id}
            className={cn(
              "border-l-4 transition-all duration-200 active:scale-[0.98] cursor-pointer",
              getStatusColor(task.status),
              "hover:shadow-md"
            )}
            onClick={() => onTaskPress(task)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm leading-5 text-foreground truncate">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs ml-2 flex-shrink-0", getPriorityColor(task.priority))}
                  >
                    {task.priority}
                  </Badge>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(task.deadline), 'h:mm a')}</span>
                    </div>
                    {task.assignedToName && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-20">{task.assignedToName}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      task.status === 'Completed' ? 'bg-green-500' :
                      task.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-300'
                    )} />
                    <span className="text-xs">{task.status}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MobileTodaysTasksSection;
