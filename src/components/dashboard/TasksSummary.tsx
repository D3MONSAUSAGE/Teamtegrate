
import React from 'react';
import DailyScoreCard from '@/components/DailyScoreCard';
import { DailyScore, Task } from '@/types';
import { CheckCircle, Clock, Target } from 'lucide-react';

interface TasksSummaryProps {
  dailyScore: DailyScore;
  todaysTasks: Task[];
  upcomingTasks: Task[];
}

const TasksSummary: React.FC<TasksSummaryProps> = ({
  dailyScore,
  todaysTasks,
  upcomingTasks
}) => {
  const completedToday = todaysTasks.filter(task => task.status === 'Completed').length;
  const completionRate = todaysTasks.length > 0 ? (completedToday / todaysTasks.length) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
      <div className="lg:col-span-1">
        <DailyScoreCard score={dailyScore} />
      </div>
      
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="group glass-card border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-card/95 dark:via-card/90 dark:to-card/85 backdrop-blur-xl rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-card-foreground">Today's Tasks</h3>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {todaysTasks.length}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="text-muted-foreground">
                {completedToday} completed
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="text-muted-foreground">
                {completionRate.toFixed(0)}% done
              </div>
            </div>
          </div>
        </div>

        <div className="group glass-card border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-card/95 dark:via-card/90 dark:to-card/85 backdrop-blur-xl rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-600/20">
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-card-foreground">Upcoming Tasks</h3>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              {upcomingTasks.length}
            </div>
            <div className="text-sm text-muted-foreground">Next 7 days</div>
          </div>
        </div>

        <div className="group glass-card border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-card/95 dark:via-card/90 dark:to-card/85 backdrop-blur-xl rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20">
              <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-card-foreground">Completion Rate</h3>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
              {completionRate.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground">Today's progress</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksSummary;
