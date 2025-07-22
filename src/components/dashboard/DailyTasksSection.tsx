
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle2, Clock, Calendar, Zap } from 'lucide-react';
import { Task } from '@/types';
import { format, isToday, isTomorrow } from 'date-fns';

interface DailyTasksSectionProps {
  tasks: Task[];
  onCreateTask: () => void;
}

const DailyTasksSection: React.FC<DailyTasksSectionProps> = ({ tasks, onCreateTask }) => {
  const todaysTasks = tasks.filter(task => 
    task.deadline && isToday(new Date(task.deadline))
  );
  
  const upcomingTasks = tasks.filter(task => 
    task.deadline && isTomorrow(new Date(task.deadline))
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Zap className="h-4 w-4 text-amber-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'medium':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      case 'low':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
      default:
        return 'bg-gradient-to-r from-slate-500 to-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Today's Tasks */}
      <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5" />
              <CardTitle className="text-lg">Today's Focus</CardTitle>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {todaysTasks.length} tasks
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCreateTask}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {todaysTasks.length > 0 ? (
            <div className="space-y-4">
              {todaysTasks.slice(0, 4).map(task => (
                <div key={task.id} className="flex items-center space-x-4 p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 dark:hover:bg-slate-700/60 transition-all duration-300">
                  <div className="flex-shrink-0">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {task.title}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Due today at {format(new Date(task.deadline), 'h:mm a')}
                    </p>
                  </div>
                  <Badge className={`${getPriorityColor(task.priority)} border-0 shadow-sm`}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="relative">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                All clear for today! 🎉
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                No tasks scheduled for today. Great time to plan ahead or take a break.
              </p>
              <Button onClick={onCreateTask} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Today's Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tomorrow's Tasks Preview */}
      {upcomingTasks.length > 0 && (
        <Card className="overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50 dark:border-purple-800/30">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5" />
              <CardTitle className="text-lg">Tomorrow's Preview</CardTitle>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {upcomingTasks.length} tasks
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {upcomingTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {task.title}
                    </p>
                  </div>
                  <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyTasksSection;
