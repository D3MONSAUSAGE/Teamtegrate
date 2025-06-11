
import React from 'react';
import { useTask } from '@/contexts/task';
import { format } from 'date-fns';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { 
  TaskStatusDistribution, 
  TaskPriorityDistribution, 
  TaskCompletionTrend 
} from './task/TaskCharts';

// Simple completion trend calculation
const getTasksCompletionByDate = (tasks: Task[], days: number) => {
  const result = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const completed = tasks.filter(task => {
      if (task.status !== 'Completed' || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= date && completedDate < nextDate;
    }).length;
    
    const total = tasks.filter(task => {
      const createdDate = new Date(task.createdAt);
      return createdDate <= nextDate;
    }).length;
    
    result.push({ date, completed, total });
  }
  
  return result;
};

const TaskReports: React.FC = () => {
  const { tasks } = useTask();
  
  // Use tasks directly - they're already Task[]
  const taskList = tasks as Task[];
  
  // Task status distribution data
  const statusCounts = React.useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      'To Do': 0,
      'In Progress': 0,
      'Completed': 0
    };
    
    taskList.forEach(task => {
      counts[task.status]++;
    });
    
    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  }, [taskList]);
  
  // Task priority distribution data
  const priorityCounts = React.useMemo(() => {
    const counts: Record<TaskPriority, number> = {
      'Low': 0,
      'Medium': 0,
      'High': 0
    };
    
    taskList.forEach(task => {
      counts[task.priority]++;
    });
    
    return Object.entries(counts).map(([priority, count]) => ({
      name: priority,
      value: count
    }));
  }, [taskList]);
  
  // Task completion trend (last 14 days)
  const completionTrend = React.useMemo(() => {
    const data = getTasksCompletionByDate(taskList, 14);
    return data.map(item => ({
      date: format(item.date, 'MMM dd'),
      completed: item.completed,
      total: item.total
    }));
  }, [taskList]);
  
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
