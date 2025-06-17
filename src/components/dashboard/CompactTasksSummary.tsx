
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
  const completedToday = todaysTasks.filter(task => task.status === 'Completed').length;
  const pendingToday = todaysTasks.filter(task => task.status !== 'Completed').length;

  const stats = [
    {
      label: 'Daily Score',
      value: `${dailyScore}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20'
    },
    {
      label: 'Completed',
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
    <Card className="bg-card/70 backdrop-blur-sm border shadow-lg">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Task Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center p-4 rounded-lg bg-muted/20">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactTasksSummary;
