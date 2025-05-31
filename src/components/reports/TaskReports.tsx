
import React from 'react';
import { useTask } from '@/contexts/task';
import { format } from 'date-fns';
import { getTasksCompletionByDate } from '@/contexts/task/taskMetrics';
import { TaskStatus, TaskPriority } from '@/types';
import { 
  TaskStatusDistribution, 
  TaskPriorityDistribution, 
  TaskCompletionTrend 
} from './task/TaskCharts';

const TaskReports: React.FC = () => {
  const { tasks } = useTask();
  
  // Task status distribution data
  const statusCounts = React.useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      'To Do': 0,
      'In Progress': 0,
      'Done': 0,
      'Pending': 0
    };
    
    tasks.forEach(task => {
      counts[task.status]++;
    });
    
    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  }, [tasks]);
  
  // Task priority distribution data
  const priorityCounts = React.useMemo(() => {
    const counts: Record<TaskPriority, number> = {
      'Low': 0,
      'Medium': 0,
      'High': 0
    };
    
    tasks.forEach(task => {
      counts[task.priority]++;
    });
    
    return Object.entries(counts).map(([priority, count]) => ({
      name: priority,
      value: count
    }));
  }, [tasks]);
  
  // Task completion trend (last 14 days)
  const completionTrend = React.useMemo(() => {
    const data = getTasksCompletionByDate(tasks, 14);
    return data.map(item => ({
      date: format(item.date, 'MMM dd'),
      completed: item.completed,
      total: item.total
    }));
  }, [tasks]);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TaskStatusDistribution statusCounts={statusCounts} />
        <TaskPriorityDistribution priorityCounts={priorityCounts} />
      </div>
      <TaskCompletionTrend completionTrend={completionTrend} />
    </div>
  );
};

export default TaskReports;
