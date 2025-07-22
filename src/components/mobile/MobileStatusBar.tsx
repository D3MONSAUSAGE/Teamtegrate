
import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  Trophy, 
  CheckCircle, 
  AlertTriangle, 
  Zap 
} from 'lucide-react';
import { Task } from '@/types';

interface MobileStatusBarProps {
  dailyScore: number;
  todaysTasks: Task[];
  upcomingTasks: Task[];
  overdueTasks: Task[];
}

const MobileStatusBar: React.FC<MobileStatusBarProps> = ({
  dailyScore,
  todaysTasks,
  upcomingTasks,
  overdueTasks
}) => {
  const completedToday = todaysTasks.filter(task => task.status === 'Completed').length;
  const highPriorityTasks = [...todaysTasks, ...upcomingTasks].filter(task => task.priority === 'High').length;

  const stats = [
    {
      icon: Trophy,
      value: dailyScore,
      label: 'Score',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20'
    },
    {
      icon: CheckCircle,
      value: completedToday,
      label: 'Done',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
    },
    {
      icon: AlertTriangle,
      value: overdueTasks.length,
      label: 'Overdue',
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'
    },
    {
      icon: Zap,
      value: highPriorityTasks,
      label: 'Priority',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20'
    }
  ];

  return (
    <div className="px-3 py-2">
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.label}
              className={`
                h-14 border-0 shadow-sm hover:shadow-md transition-all duration-200
                ${stat.bgColor}
              `}
            >
              <div className="p-2 h-full flex flex-col items-center justify-center">
                <div className={`p-1 rounded-full bg-gradient-to-r ${stat.color} mb-1`}>
                  <Icon className="h-2.5 w-2.5 text-white" />
                </div>
                <div className={`text-sm font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium leading-none">
                  {stat.label}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MobileStatusBar;
