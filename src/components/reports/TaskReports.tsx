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
        <TaskStatusDistribution data={statusCounts.map(item => ({ ...item, color: getStatusColor(item.name) }))} />
        <TaskPriorityDistribution data={priorityCounts.map(item => ({ ...item, color: getPriorityColor(item.name) }))} />
      </div>
      <TaskCompletionTrend data={completionTrend.map(item => ({ ...item, created: item.total }))} />
    </div>
  );
};

// Helper functions for colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'To Do': return '#94a3b8';
    case 'In Progress': return '#3b82f6';
    case 'Completed': return '#10b981';
    default: return '#6b7280';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Low': return '#10b981';
    case 'Medium': return '#f59e0b';
    case 'High': return '#ef4444';
    default: return '#6b7280';
  }
};

export default TaskReports;
