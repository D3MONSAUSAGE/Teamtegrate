
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  Trophy, 
  CheckCircle, 
  AlertTriangle, 
  Zap,
  Target,
  Clock
} from 'lucide-react';
import { Task } from '@/types';

interface StatsHeroSectionProps {
  dailyScore: number;
  todaysTasks: Task[];
  upcomingTasks: Task[];
  overdueTasks: Task[];
}

const StatsHeroSection: React.FC<StatsHeroSectionProps> = ({
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
      gradient: 'from-yellow-400 to-orange-500',
      bgGradient: 'from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-950/30 dark:via-orange-950/30 dark:to-red-950/30',
      description: 'Daily goal progress'
    },
    {
      icon: CheckCircle,
      value: completedToday,
      label: 'Done',
      gradient: 'from-green-400 to-emerald-500',
      bgGradient: 'from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30',
      description: 'Tasks completed today'
    },
    {
      icon: AlertTriangle,
      value: overdueTasks.length,
      label: 'Overdue',
      gradient: 'from-red-400 to-pink-500',
      bgGradient: 'from-red-50 via-pink-50 to-rose-50 dark:from-red-950/30 dark:via-pink-950/30 dark:to-rose-950/30',
      description: 'Need attention'
    },
    {
      icon: Zap,
      value: highPriorityTasks,
      label: 'Priority',
      gradient: 'from-purple-400 to-indigo-500',
      bgGradient: 'from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30',
      description: 'High priority tasks'
    }
  ];

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className={`
                relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300
                bg-gradient-to-br ${stat.bgGradient}
                backdrop-blur-sm
              `}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <div className="relative p-4 h-24 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <motion.div 
                      className={`p-2 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg`}
                      whileHover={{ rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </motion.div>
                    <motion.div 
                      className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                    >
                      {stat.value}
                    </motion.div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {stat.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.description}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick insights */}
      <motion.div 
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-0 shadow-md">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-foreground">Today's Focus</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {todaysTasks.length === 0 
                ? "No tasks scheduled for today. Great time to plan ahead!"
                : `${todaysTasks.length - completedToday} tasks remaining for today. ${
                    dailyScore >= 80 ? "You're doing amazing!" : 
                    dailyScore >= 50 ? "Keep up the good work!" : 
                    "Let's make some progress!"
                  }`
              }
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default StatsHeroSection;
