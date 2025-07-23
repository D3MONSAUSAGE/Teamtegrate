
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTask } from '@/contexts/task/TaskContext';

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
  progress: number;
}

const MobileStatsCards: React.FC = () => {
  const { tasks, dailyScore } = useTask();

  const todaysTasks = tasks.filter(task => {
    const today = new Date();
    const taskDate = new Date(task.createdAt);
    return taskDate.toDateString() === today.toDateString();
  });

  const completedToday = todaysTasks.filter(task => task.status === 'Completed').length;
  const overdueTasks = tasks.filter(task => {
    const today = new Date();
    const deadline = new Date(task.deadline);
    return deadline < today && task.status !== 'Completed';
  }).length;

  const highPriorityTasks = tasks.filter(task => task.priority === 'High' && task.status !== 'Completed').length;

  const stats: StatCard[] = [
    {
      title: 'Daily Score',
      value: `${dailyScore.percentage}%`,
      subtitle: 'Productivity',
      icon: TrendingUp,
      color: 'from-orange-500 to-amber-500',
      progress: dailyScore.percentage
    },
    {
      title: 'Completed',
      value: completedToday.toString(),
      subtitle: 'Tasks today',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      progress: todaysTasks.length > 0 ? (completedToday / todaysTasks.length) * 100 : 0
    },
    {
      title: 'Overdue',
      value: overdueTasks.toString(),
      subtitle: 'Tasks behind',
      icon: AlertCircle,
      color: 'from-red-500 to-pink-500',
      progress: overdueTasks > 0 ? 100 : 0
    },
    {
      title: 'High Priority',
      value: highPriorityTasks.toString(),
      subtitle: 'Urgent tasks',
      icon: Zap,
      color: 'from-purple-500 to-violet-500',
      progress: highPriorityTasks > 0 ? 75 : 0
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className={cn(
              "relative overflow-hidden border-0 shadow-lg",
              "bg-gradient-to-br",
              stat.color,
              "hover:shadow-xl transition-all duration-300 active:scale-95"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-2xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-white/80 font-medium">
                    {stat.subtitle}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <Icon className="h-5 w-5 text-white/80" />
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-1">
                <div
                  className="bg-white h-1 rounded-full transition-all duration-500"
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MobileStatsCards;
