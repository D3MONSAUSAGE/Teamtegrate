
import { useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { format } from 'date-fns';
import { getTasksCompletionByDate } from '@/contexts/task/taskMetrics';

export const useStatusDistributionData = (tasks: Task[]) => {
  return useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      'To Do': 0,
      'In Progress': 0,
      'Pending': 0,
      'Completed': 0
    };
    
    tasks.forEach(task => {
      counts[task.status]++;
    });
    
    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  }, [tasks]);
};

export const usePriorityDistributionData = (tasks: Task[]) => {
  return useMemo(() => {
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
};

export const useCompletionTrendData = (tasks: Task[], days: number = 14) => {
  return useMemo(() => {
    const data = getTasksCompletionByDate(tasks, days);
    return data.map(item => ({
      date: format(item.date, 'MMM dd'),
      completed: item.completed,
      total: item.total
    }));
  }, [tasks, days]);
};
