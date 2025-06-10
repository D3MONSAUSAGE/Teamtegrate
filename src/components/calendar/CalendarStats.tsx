
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';

interface CalendarStatsProps {
  todayTasksCount: number;
  upcomingTasksCount: number;
  overdueTasksCount: number;
}

const CalendarStats: React.FC<CalendarStatsProps> = ({
  todayTasksCount,
  upcomingTasksCount,
  overdueTasksCount
}) => {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-6 py-4 mb-6">
      {/* Today's Tasks */}
      <div className="group flex items-center gap-3 px-4 py-3 glass-card bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-600/20">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 animate-pulse">
            {todayTasksCount}
          </div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Today</span>
        </div>
      </div>
      
      {/* Upcoming Tasks */}
      <div className="group flex items-center gap-3 px-4 py-3 glass-card bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-xl border border-emerald-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20">
          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {upcomingTasksCount}
          </div>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Upcoming</span>
        </div>
      </div>
      
      {/* Overdue Tasks - Only show if there are overdue tasks */}
      {overdueTasksCount > 0 && (
        <div className="group flex items-center gap-3 px-4 py-3 glass-card bg-gradient-to-r from-rose-500/10 to-rose-600/10 rounded-xl border border-rose-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="p-2 rounded-lg bg-gradient-to-r from-rose-500/20 to-rose-600/20">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 animate-bounce" />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300 animate-pulse">
              {overdueTasksCount}
            </div>
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Overdue</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarStats;
