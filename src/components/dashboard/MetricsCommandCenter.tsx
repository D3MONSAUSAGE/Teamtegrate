
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Calendar, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Task } from '@/types';

interface MetricsCommandCenterProps {
  tasks: Task[];
  dailyScore: number;
}

const MetricsCommandCenter: React.FC<MetricsCommandCenterProps> = ({ tasks, dailyScore }) => {
  const today = new Date();
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const todaysTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate.toDateString() === today.toDateString();
  });

  const completedTasks = tasks.filter(task => task.status === 'Completed');
  const overdueTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate < today && task.status !== 'Completed';
  });

  const weeklyTasks = tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    return taskDate >= thisWeek;
  });

  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  const todayCompletionRate = todaysTasks.length > 0 ? 
    (todaysTasks.filter(t => t.status === 'Completed').length / todaysTasks.length) * 100 : 0;

  const metrics = [
    {
      title: 'Daily Performance',
      value: dailyScore,
      suffix: '%',
      icon: Target,
      trend: dailyScore > 75 ? 'up' : dailyScore > 50 ? 'stable' : 'down',
      trendValue: '+12%',
      description: 'Productivity score',
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Task Completion',
      value: Math.round(completionRate),
      suffix: '%',
      icon: CheckCircle2,
      trend: completionRate > 80 ? 'up' : 'stable',
      trendValue: '+5%',
      description: 'Overall completion rate',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active Tasks',
      value: tasks.filter(t => t.status !== 'Completed').length,
      suffix: '',
      icon: Activity,
      trend: 'stable',
      trendValue: '±0',
      description: 'In progress',
      color: 'amber',
      gradient: 'from-amber-500 to-amber-600'
    },
    {
      title: 'Due Today',
      value: todaysTasks.length,
      suffix: '',
      icon: Calendar,
      trend: todaysTasks.length > 5 ? 'up' : 'stable',
      trendValue: todaysTasks.length > 0 ? `${Math.round(todayCompletionRate)}%` : '0%',
      description: 'Tasks due today',
      color: 'violet',
      gradient: 'from-violet-500 to-violet-600'
    },
    {
      title: 'Weekly Velocity',
      value: weeklyTasks.length,
      suffix: '',
      icon: BarChart3,
      trend: 'up',
      trendValue: '+18%',
      description: 'Tasks created this week',
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    {
      title: 'Overdue Items',
      value: overdueTasks.length,
      suffix: '',
      icon: AlertTriangle,
      trend: overdueTasks.length > 0 ? 'down' : 'stable',
      trendValue: overdueTasks.length > 0 ? `-${overdueTasks.length}` : '0',
      description: 'Require attention',
      color: 'red',
      gradient: 'from-red-500 to-red-600'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-emerald-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <div className="w-3 h-3 bg-slate-400 rounded-full" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -2 }}
        >
          <Card className="group relative overflow-hidden border-0 bg-white shadow-sm ring-1 ring-slate-200/50 hover:shadow-md transition-all duration-300">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${metric.gradient}`} />
            
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-sm`}>
                  <metric.icon className="h-5 w-5 text-white" />
                </div>
                
                <Badge 
                  variant="outline" 
                  className={`text-xs font-medium ${getTrendColor(metric.trend)} px-2 py-1`}
                >
                  {getTrendIcon(metric.trend)}
                  <span className="ml-1">{metric.trendValue}</span>
                </Badge>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  {metric.title}
                </h3>
                <div className="flex items-baseline gap-1">
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="text-2xl font-bold text-slate-900"
                  >
                    {metric.value}
                  </motion.span>
                  {metric.suffix && (
                    <span className="text-lg font-semibold text-slate-600">{metric.suffix}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default MetricsCommandCenter;
