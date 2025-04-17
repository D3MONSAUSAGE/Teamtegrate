
import React from 'react';
import { useTask } from '@/contexts/task';
import StatusDistributionChart from './tasks/StatusDistributionChart';
import PriorityDistributionChart from './tasks/PriorityDistributionChart';
import CompletionTrendChart from './tasks/CompletionTrendChart';
import { 
  useStatusDistributionData, 
  usePriorityDistributionData, 
  useCompletionTrendData 
} from './tasks/hooks/useTaskReportsData';

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
