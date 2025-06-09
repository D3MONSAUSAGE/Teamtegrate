
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

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
    <div className="flex items-center justify-center gap-6 py-3">
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-200/20">
        <Clock className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-muted-foreground">Today:</span>
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
          {todayTasksCount}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-xl border border-emerald-200/20">
        <span className="text-sm font-medium text-muted-foreground">Upcoming:</span>
        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
          {upcomingTasksCount}
        </Badge>
      </div>
      
      {overdueTasksCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500/10 to-rose-600/10 rounded-xl border border-rose-200/20">
          <span className="text-sm font-medium text-muted-foreground">Overdue:</span>
          <Badge variant="destructive" className="bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold animate-pulse">
            {overdueTasksCount}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default CalendarStats;
