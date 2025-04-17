
import React from 'react';
import { useTask } from '@/contexts/task';
import { 
  StatusDistributionChart,
  PriorityDistributionChart,
  CompletionTrendChart,
  useStatusDistributionData,
  usePriorityDistributionData,
  useCompletionTrendData
} from './tasks';

const TaskReports: React.FC = () => {
  const { tasks } = useTask();
  
  // Get processed data using our custom hooks
  const statusCounts = useStatusDistributionData(tasks);
  const priorityCounts = usePriorityDistributionData(tasks);
  const completionTrend = useCompletionTrendData(tasks, 14);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <StatusDistributionChart data={statusCounts} />
        
        {/* Task Priority Distribution */}
        <PriorityDistributionChart data={priorityCounts} />
      </div>
      
      {/* Task Completion Trend */}
      <CompletionTrendChart data={completionTrend} />
    </div>
  );
};

export default TaskReports;
