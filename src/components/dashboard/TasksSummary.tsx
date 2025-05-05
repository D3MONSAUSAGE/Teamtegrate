
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import DailyScoreCard from '@/components/DailyScoreCard';
import { DailyScore, Task } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface TasksSummaryProps {
  dailyScore: DailyScore;
  todaysTasks: Task[];
  upcomingTasks: Task[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

const TasksSummary: React.FC<TasksSummaryProps> = ({
  dailyScore,
  todaysTasks,
  upcomingTasks,
  isLoading = false,
  onRefresh
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Task card component to avoid duplication
  const TaskCard = ({ title, count, completed, subtitle }: { 
    title: string; 
    count: number; 
    completed?: number;
    subtitle: string;
  }) => (
    <div className="bg-white dark:bg-card p-3 md:p-4 rounded-lg border">
      <div className="flex justify-between items-start">
        <h3 className="font-medium mb-2">{title}</h3>
        {title === "Today's Tasks" && onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh tasks</span>
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <>
          <div className="text-2xl md:text-3xl font-bold">{count}</div>
          <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            {completed !== undefined ? `${completed} completed` : subtitle}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
      <DailyScoreCard score={dailyScore} />
      
      <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <TaskCard 
          title="Today's Tasks" 
          count={todaysTasks.length} 
          completed={todaysTasks.filter(task => task.status === 'Completed').length}
          subtitle=""
        />
        <TaskCard 
          title="Upcoming Tasks" 
          count={upcomingTasks.length} 
          subtitle="Next 7 days"
        />
      </div>
    </div>
  );
};

export default TasksSummary;
