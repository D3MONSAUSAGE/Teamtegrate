
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users,
  Target,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react';
import { Task } from '@/types';
import { useOrganizationStats } from '@/hooks/useOrganizationStats';
import { isTaskOverdue } from '@/utils/taskUtils';

interface ExecutiveMetricsGridProps {
  tasks: Task[];
}

const ExecutiveMetricsGrid: React.FC<ExecutiveMetricsGridProps> = ({ tasks }) => {
  const { stats } = useOrganizationStats();
  
  const today = new Date();
  const todaysTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate.toDateString() === today.toDateString();
  });

  const completedTasks = tasks.filter(task => task.status === 'Completed');
  const overdueTasks = tasks.filter(task => isTaskOverdue(task));
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const metrics = [
    {
      title: 'Organization Health',
      value: '92%',
      change: '+5%',
      trend: 'up',
      icon: Activity,
      description: 'Overall performance',
      gradient: 'from-dashboard-success to-dashboard-success-light',
      iconBg: 'bg-dashboard-success/10',
      iconColor: 'text-dashboard-success'
    },
    {
      title: 'Team Productivity',
      value: `${Math.round(completionRate)}%`,
      change: '+12%',
      trend: 'up',
      icon: Target,
      description: 'Task completion rate',
      gradient: 'from-dashboard-primary to-dashboard-primary-light',
      iconBg: 'bg-dashboard-primary/10',
      iconColor: 'text-dashboard-primary'
    },
    {
      title: 'Active Projects',
      value: stats?.active_projects || 0,
      change: '+3',
      trend: 'up',
      icon: BarChart3,
      description: 'Currently in progress',
      gradient: 'from-dashboard-teal to-dashboard-teal-light',
      iconBg: 'bg-dashboard-teal/10',
      iconColor: 'text-dashboard-teal'
    },
    {
      title: 'Team Members',
      value: stats?.total_users || 0,
      change: '+2',
      trend: 'up',
      icon: Users,
      description: 'Active contributors',
      gradient: 'from-dashboard-purple to-dashboard-purple-light',
      iconBg: 'bg-dashboard-purple/10',
      iconColor: 'text-dashboard-purple'
    },
    {
      title: 'Tasks Due Today',
      value: todaysTasks.length,
      change: todaysTasks.length > 5 ? 'High' : 'Normal',
      trend: todaysTasks.length > 5 ? 'warning' : 'neutral',
      icon: Clock,
      description: 'Require attention',
      gradient: 'from-dashboard-warning to-dashboard-warning-light',
      iconBg: 'bg-dashboard-warning/10',
      iconColor: 'text-dashboard-warning'
    },
    {
      title: 'Velocity Score',
      value: '8.4',
      change: '+0.7',
      trend: 'up',
      icon: Zap,
      description: 'Team efficiency',
      gradient: 'from-dashboard-success to-dashboard-teal',
      iconBg: 'bg-dashboard-success/10',
      iconColor: 'text-dashboard-success'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-dashboard-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-dashboard-error" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-dashboard-warning" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-dashboard-success bg-dashboard-success/10';
      case 'down':
        return 'text-dashboard-error bg-dashboard-error/10';
      case 'warning':
        return 'text-dashboard-warning bg-dashboard-warning/10';
      default:
        return 'text-dashboard-gray-600 bg-dashboard-gray-100';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <Card 
          key={metric.title}
          className="group relative overflow-hidden border-0 shadow-base hover:shadow-lg transition-all duration-300 bg-dashboard-card hover:bg-dashboard-card-hover cursor-pointer"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 rounded-xl ${metric.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <metric.icon className={`h-7 w-7 ${metric.iconColor}`} />
              </div>
              
              <Badge 
                variant="secondary" 
                className={`flex items-center gap-1 ${getTrendColor(metric.trend)} border-0 px-2 py-1`}
              >
                {getTrendIcon(metric.trend)}
                <span className="text-xs font-medium">{metric.change}</span>
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-dashboard-gray-600">
                {metric.title}
              </h3>
              <p className="text-3xl font-bold text-dashboard-gray-900">
                {metric.value}
              </p>
              <p className="text-sm text-dashboard-gray-500">
                {metric.description}
              </p>
            </div>
            
            {/* Gradient accent */}
            <div 
              className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${metric.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ExecutiveMetricsGrid;
