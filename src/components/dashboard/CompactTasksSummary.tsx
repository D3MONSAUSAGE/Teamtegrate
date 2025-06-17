
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Task } from '@/types';

interface CompactTasksSummaryProps {
  dailyScore: number;
  todaysTasks: Task[];
  upcomingTasks: Task[];
}

const CompactTasksSummary: React.FC<CompactTasksSummaryProps> = ({
  dailyScore,
  todaysTasks,
  upcomingTasks
}) => {
  const completedToday = todaysTasks.filter(task => task.status === 'completed').length;
  const pendingToday = todaysTasks.filter(task => task.status !== 'completed').length;

  const stats = [
    {
      label: 'Score',
      value: `${dailyScore}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20'
    },
    {
      label: 'Done',
      value: completedToday,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20'
    },
    {
      label: 'Pending',
      value: pendingToday,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20'
    },
    {
      label: 'Upcoming',
      value: upcomingTasks.length,
      icon: AlertCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    }
  ];

  return (
    <Card className="bg-card/70 backdrop-blur-sm border">
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactTasksSummary;
