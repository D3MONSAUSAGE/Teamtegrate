
import React from 'react';
import DailyScoreCard from '@/components/DailyScoreCard';
import { DailyScore, Task } from '@/types';

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
      <DailyScoreCard score={dailyScore} />
      
      <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white p-3 md:p-4 rounded-lg border">
          <h3 className="font-medium mb-2">Today's Tasks</h3>
          <div className="text-2xl md:text-3xl font-bold">{todaysTasks.length}</div>
          <div className="text-xs md:text-sm text-gray-500">
            {todaysTasks.filter(task => task.status === 'Completed').length} completed
          </div>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg border">
          <h3 className="font-medium mb-2">Upcoming Tasks</h3>
          <div className="text-2xl md:text-3xl font-bold">{upcomingTasks.length}</div>
          <div className="text-xs md:text-sm text-gray-500">Next 7 days</div>
        </div>
      </div>
    </div>
  );
};

export default TasksSummary;
