
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
  overdueTasks: Task[];
}

const InteractiveStatsGrid: React.FC<InteractiveStatsGridProps> = ({
  dailyScore,
  todaysTasks,
  upcomingTasks,
  overdueTasks
}) => {
  const completedToday = todaysTasks.filter(task => task.status === 'Completed').length;
  const highPriorityTasks = [...todaysTasks, ...upcomingTasks].filter(task => task.priority === 'High').length;
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
      value: overdueTasks.length,
      subtitle: 'Need attention',
      icon: AlertTriangle,
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20',
      progress: overdueTasks.length > 0 ? 100 : 0,
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.title}
            className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-card"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
              
              {stat.progress !== undefined && (
                <div className="space-y-1">
                  <Progress value={stat.progress} className="h-1.5" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{stat.subtitle}</span>
                    <span>{stat.progress}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default InteractiveStatsGrid;
