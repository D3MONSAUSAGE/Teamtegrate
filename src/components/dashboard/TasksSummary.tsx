
import React from 'react';
import EnhancedTasksSummary from './EnhancedTasksSummary';
import { DailyScore, Task } from '@/types';

interface TasksSummaryProps {
  dailyScore: DailyScore;
  todaysTasks: Task[];
  upcomingTasks: Task[];
}

const TasksSummary: React.FC<TasksSummaryProps> = (props) => {
  return <EnhancedTasksSummary {...props} />;
};

export default TasksSummary;
