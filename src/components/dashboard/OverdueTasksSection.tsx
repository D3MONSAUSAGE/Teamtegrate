
import React from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface OverdueTasksSectionProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

const OverdueTasksSection: React.FC<OverdueTasksSectionProps> = ({
  tasks,
  onCreateTask,
  onEditTask
}) => {
  if (tasks.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/10 dark:bg-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-red-800 dark:text-red-300 text-xl font-bold">
                Overdue Tasks
              </CardTitle>
              <p className="text-red-600 dark:text-red-400 text-sm">
                {tasks.length} task{tasks.length === 1 ? '' : 's'} need immediate attention
              </p>
            </div>
          </div>
          <Button
            onClick={onCreateTask}
            size="sm"
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="group relative p-4 rounded-lg border border-red-200 dark:border-red-800 bg-white/60 dark:bg-gray-900/60 hover:bg-red-50/80 dark:hover:bg-red-950/40 transition-all duration-200 cursor-pointer"
              onClick={() => onEditTask(task)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-red-700 dark:group-hover:text-red-300">
                      {task.title}
                    </h4>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-red-600 dark:text-red-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due {format(new Date(task.deadline), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {Math.ceil((new Date().getTime() - new Date(task.deadline).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
          
          {tasks.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-sm text-red-600 dark:text-red-400">
                +{tasks.length - 5} more overdue task{tasks.length - 5 === 1 ? '' : 's'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OverdueTasksSection;
