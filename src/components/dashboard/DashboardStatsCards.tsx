
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { Task, DailyScore } from '@/types';

interface DashboardStatsCardsProps {
  tasks: Task[];
  dailyScore: DailyScore;
}

const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ tasks, dailyScore }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const completedToday = todayTasks.filter(task => task.status === 'Completed').length;
  const totalToday = todayTasks.length;

  const overdueTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate < today && task.status !== 'Completed';
  });

  const highPriorityTasks = tasks.filter(task => task.priority === 'High' && task.status !== 'Completed');

  const stats = [
    {
      title: 'Daily Score',
      value: `${dailyScore.percentage}%`,
      progress: dailyScore.percentage,
      icon: Target,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
    },
    {
      title: 'Completed Today',
      value: `${completedToday}/${totalToday}`,
      progress: totalToday > 0 ? (completedToday / totalToday) * 100 : 0,
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks.length.toString(),
      progress: overdueTasks.length > 0 ? 100 : 0,
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20'
    },
    {
      title: 'High Priority',
      value: highPriorityTasks.length.toString(),
      progress: highPriorityTasks.length > 0 ? 100 : 0,
      icon: Zap,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className={`${stat.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} text-white`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.title}</div>
                </div>
              </div>
              <Progress 
                value={stat.progress} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground mt-2">
                {stat.title === 'Daily Score' && totalToday === 0 && 'No tasks scheduled for today'}
                {stat.title === 'Daily Score' && totalToday > 0 && `${totalToday - completedToday} tasks remaining`}
                {stat.title === 'Completed Today' && 'tasks completed'}
                {stat.title === 'Overdue Tasks' && (overdueTasks.length === 0 ? 'All caught up!' : 'urgent tasks')}
                {stat.title === 'High Priority' && 'urgent tasks'}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStatsCards;
