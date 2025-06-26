
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Zap, 
  Target, 
  TrendingUp, 
  Calendar,
  Trophy,
  AlertTriangle
} from 'lucide-react';
import { Task } from '@/types';
import { isTaskOverdue } from '@/utils/taskUtils';

interface InteractiveStatsGridProps {
  dailyScore: number;
  todaysTasks: Task[];
  upcomingTasks: Task[];
}

const InteractiveStatsGrid: React.FC<InteractiveStatsGridProps> = ({
  dailyScore,
  todaysTasks,
  upcomingTasks
}) => {
  const completedToday = todaysTasks.filter(task => task.status === 'Completed').length;
  const allTasks = [...todaysTasks, ...upcomingTasks];
  const overdueTasks = allTasks.filter(task => isTaskOverdue(task)).length;
  const highPriorityTasks = allTasks.filter(task => task.priority === 'High').length;
  const completionRate = todaysTasks.length > 0 ? Math.round((completedToday / todaysTasks.length) * 100) : 0;

  const stats = [
    {
      title: 'Daily Score',
      value: dailyScore,
      subtitle: 'Productivity Score',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-950/10 dark:to-purple-950/10',
      progress: dailyScore,
      maxValue: 100
    },
    {
      title: 'Completed Today',
      value: completedToday,
      subtitle: `${completedToday}/${todaysTasks.length} tasks`,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
      progress: completionRate,
      maxValue: 100
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks,
      subtitle: 'Need attention',
      icon: AlertTriangle,
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20',
      progress: overdueTasks > 0 ? 100 : 0,
      maxValue: 100
    },
    {
      title: 'High Priority',
      value: highPriorityTasks,
      subtitle: 'Urgent tasks',
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
      progress: highPriorityTasks > 0 ? 90 : 0,
      maxValue: 100
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.title}
            className={`group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${stat.bgColor}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform`}>
                      {stat.value}
                    </span>
                    {stat.maxValue && (
                      <span className="text-sm text-muted-foreground">
                        {stat.title === 'Daily Score' ? '%' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className={`p-2 rounded-full bg-gradient-to-r ${stat.color} group-hover:rotate-12 transition-transform`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
              
              {stat.progress !== undefined && (
                <div className="space-y-2">
                  <Progress 
                    value={stat.progress} 
                    className="h-2 group-hover:h-3 transition-all duration-300" 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{stat.progress}%</span>
                  </div>
                </div>
              )}
            </CardContent>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Card>
        );
      })}
    </div>
  );
};

export default InteractiveStatsGrid;
