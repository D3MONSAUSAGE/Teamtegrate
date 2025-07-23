import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { Task } from '@/types';

interface GlassMorphismStatsGridProps {
  tasks: Task[];
  dailyScore: number;
}

const GlassMorphismStatsGrid: React.FC<GlassMorphismStatsGridProps> = ({ tasks, dailyScore }) => {
  const today = new Date();
  const todaysTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate.toDateString() === today.toDateString();
  });

  const completedTasks = tasks.filter(task => task.status === 'Completed');
  const overdueTasks = tasks.filter(task => {
    const taskDate = new Date(task.deadline);
    return taskDate < today && task.status !== 'Completed';
  });

  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const stats = [
    {
      title: 'Daily Score',
      value: dailyScore,
      suffix: '%',
      icon: TrendingUp,
      color: 'from-dashboard-success to-dashboard-success-light',
      bgColor: 'bg-dashboard-success/10',
      textColor: 'text-dashboard-success',
      description: 'Productivity score',
      progress: dailyScore
    },
    {
      title: 'Completion Rate',
      value: Math.round(completionRate),
      suffix: '%',
      icon: Target,
      color: 'from-dashboard-primary to-dashboard-primary-light',
      bgColor: 'bg-dashboard-primary/10',
      textColor: 'text-dashboard-primary',
      description: 'Task completion',
      progress: completionRate
    },
    {
      title: 'Today\'s Tasks',
      value: todaysTasks.length,
      suffix: '',
      icon: Calendar,
      color: 'from-dashboard-teal to-dashboard-teal-light',
      bgColor: 'bg-dashboard-teal/10',
      textColor: 'text-dashboard-teal',
      description: 'Due today',
      progress: todaysTasks.length > 0 ? (todaysTasks.filter(t => t.status === 'Completed').length / todaysTasks.length) * 100 : 0
    },
    {
      title: 'Overdue',
      value: overdueTasks.length,
      suffix: '',
      icon: AlertTriangle,
      color: 'from-dashboard-error to-dashboard-error-light',
      bgColor: 'bg-dashboard-error/10',
      textColor: 'text-dashboard-error',
      description: 'Need attention',
      progress: overdueTasks.length > 0 ? 100 : 0
    }
  ];

  const CircularProgress = ({ progress, color }: { progress: number; color: string }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Safe color parsing with fallbacks
    const parseGradientColors = (colorString: string) => {
      const parts = colorString.split(' ');
      
      // Default fallback colors
      const defaultFrom = 'dashboard-primary';
      const defaultTo = 'dashboard-primary-light';
      
      // Extract from and to colors safely
      const fromColor = parts.length > 0 && parts[0] ? parts[0].replace('from-', '') : defaultFrom;
      const toColor = parts.length > 2 && parts[2] ? parts[2].replace('to-', '') : defaultTo;
      
      return { fromColor, toColor };
    };

    const { fromColor, toColor } = parseGradientColors(color);

    return (
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-dashboard-gray-200"
          />
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            stroke="url(#gradient)"
            strokeWidth="3"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={`stop-${fromColor}`} />
              <stop offset="100%" className={`stop-${toColor}`} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-dashboard-gray-900">{Math.round(progress)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          whileHover={{ y: -5 }}
        >
          <Card className="group relative overflow-hidden border-0 bg-white/60 backdrop-blur-xl hover:bg-white/70 transition-all duration-300 shadow-xl hover:shadow-2xl">
            {/* Glass morphism background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent" />
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
            
            <CardContent className="relative p-8">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 rounded-2xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-8 w-8 ${stat.textColor}`} />
                </div>
                <CircularProgress progress={stat.progress} color={stat.color} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-dashboard-gray-600 uppercase tracking-wider">
                  {stat.title}
                </h3>
                <div className="flex items-baseline gap-1">
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className="text-4xl font-bold text-dashboard-gray-900"
                  >
                    {stat.value}
                  </motion.span>
                  {stat.suffix && (
                    <span className="text-xl font-semibold text-dashboard-gray-600">{stat.suffix}</span>
                  )}
                </div>
                <p className="text-sm text-dashboard-gray-500">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default GlassMorphismStatsGrid;
