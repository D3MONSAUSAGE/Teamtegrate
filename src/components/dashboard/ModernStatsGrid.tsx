import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';
import { Task } from '@/types';

interface ModernStatsGridProps {
  dailyScore: number;
  todaysTasks: Task[];
  upcomingTasks: Task[];
  overdueTasks: Task[];
}

const ModernStatsGrid: React.FC<ModernStatsGridProps> = ({
  dailyScore,
  todaysTasks,
  upcomingTasks,
  overdueTasks
}) => {
  const completedToday = todaysTasks.filter(task => task.status === 'Completed').length;
  const totalTasks = todaysTasks.length;
  
  const stats = [
    {
      title: 'Daily Score',
      value: `${dailyScore}%`,
      icon: TrendingUp,
      description: 'Productivity score',
      gradient: 'from-dashboard-accent to-dashboard-accent-light',
      iconBg: 'bg-dashboard-accent/10',
      iconColor: 'text-dashboard-accent'
    },
    {
      title: 'Tasks Today',
      value: `${completedToday}/${totalTasks}`,
      icon: Target,
      description: 'Completed tasks',
      gradient: 'from-dashboard-info to-blue-400',
      iconBg: 'bg-dashboard-info/10',
      iconColor: 'text-dashboard-info'
    },
    {
      title: 'Upcoming',
      value: upcomingTasks.length,
      icon: Calendar,
      description: 'Tasks due soon',
      gradient: 'from-dashboard-warning to-yellow-400',
      iconBg: 'bg-dashboard-warning/10',
      iconColor: 'text-dashboard-warning'
    },
    {
      title: 'Overdue',
      value: overdueTasks.length,
      icon: AlertTriangle,
      description: 'Needs attention',
      gradient: 'from-destructive to-red-400',
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card 
          key={stat.title}
          className="group relative overflow-hidden border-0 shadow-base hover:shadow-lg transition-all duration-300 bg-dashboard-card hover:bg-dashboard-card-hover cursor-pointer"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </div>
              
              {/* Gradient accent */}
              <div 
                className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-full -mr-10 -mt-10 group-hover:opacity-10 transition-opacity duration-300`}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ModernStatsGrid;