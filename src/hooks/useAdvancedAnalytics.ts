
import { useMemo } from 'react';
import { Task } from '@/types';
import { subDays, format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export interface AnalyticsData {
  completionTrend: Array<{
    date: string;
    completed: number;
    total: number;
    completionRate: number;
  }>;
  statusDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  priorityDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  velocityData: Array<{
    period: string;
    completed: number;
    created: number;
    velocity: number;
  }>;
  heatmapData: Array<{
    date: Date;
    value: number;
    level: number;
  }>;
  productivityScore: number;
  trends: {
    completionRate: number;
    velocity: number;
    efficiency: number;
  };
}

export const useAdvancedAnalytics = (tasks: Task[], timeRange: string = '30 days') => {
  return useMemo(() => {
    const days = timeRange === '7 days' ? 7 : timeRange === '30 days' ? 30 : 90;
    const today = new Date();
    const startDate = subDays(today, days);

    // Filter tasks within time range - handle missing dates
    const filteredTasks = tasks.filter(task => {
      const taskDate = task.createdAt ? new Date(task.createdAt) : (task.updatedAt ? new Date(task.updatedAt) : new Date());
      return isAfter(taskDate, startDate) && isBefore(taskDate, endOfDay(today));
    });

    // Generate completion trend data
    const completionTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayTasks = filteredTasks.filter(task => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        return isAfter(deadline, dayStart) && isBefore(deadline, dayEnd);
      });
      
      const completed = dayTasks.filter(task => task.status === 'Completed').length;
      const total = dayTasks.length;
      
      completionTrend.push({
        date: format(date, 'yyyy-MM-dd'),
        completed,
        total,
        completionRate: total > 0 ? (completed / total) * 100 : 0
      });
    }

    // Status distribution
    const statusCounts = filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusColors = {
      'To Do': '#94a3b8',
      'In Progress': '#3b82f6',
      'Pending': '#f59e0b',
      'Completed': '#10b981'
    };

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: statusColors[status as keyof typeof statusColors] || '#6b7280'
    }));

    // Priority distribution
    const priorityCounts = filteredTasks.reduce((acc, task) => {
      const priority = task.priority || 'Medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityColors = {
      'Low': '#10b981',
      'Medium': '#f59e0b',
      'High': '#ef4444',
      'Urgent': '#dc2626'
    };

    const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority,
      value: count,
      color: priorityColors[priority as keyof typeof priorityColors] || '#6b7280'
    }));

    // Velocity data (weekly)
    const velocityData = [];
    const weeksToShow = Math.min(Math.ceil(days / 7), 12);
    
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekStart = subDays(today, (i + 1) * 7);
      const weekEnd = subDays(today, i * 7);
      
      const weekTasks = tasks.filter(task => {
        const taskDate = task.createdAt ? new Date(task.createdAt) : (task.updatedAt ? new Date(task.updatedAt) : new Date());
        return isAfter(taskDate, weekStart) && isBefore(taskDate, weekEnd);
      });
      
      const weekDeadlineTasks = tasks.filter(task => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        return isAfter(deadline, weekStart) && isBefore(deadline, weekEnd);
      });
      
      const completed = weekDeadlineTasks.filter(task => task.status === 'Completed').length;
      const created = weekTasks.length;
      
      velocityData.push({
        period: format(weekStart, 'MMM dd'),
        completed,
        created,
        velocity: completed - created
      });
    }

    // Heatmap data
    const heatmapData = [];
    for (let i = 83; i >= 0; i--) { // 12 weeks of data
      const date = subDays(today, i);
      const dayTasks = tasks.filter(task => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        return format(deadline, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });
      
      const completed = dayTasks.filter(task => task.status === 'Completed').length;
      const level = completed === 0 ? 0 : 
                   completed <= 2 ? 1 : 
                   completed <= 4 ? 2 : 
                   completed <= 6 ? 3 : 4;
      
      heatmapData.push({
        date,
        value: completed,
        level
      });
    }

    // Calculate productivity score (0-100)
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === 'Completed').length;
    const overdueTasks = filteredTasks.filter(task => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      return isBefore(deadline, today) && task.status !== 'Completed';
    }).length;
    
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
    const overdueRate = totalTasks > 0 ? overdueTasks / totalTasks : 0;
    const productivityScore = Math.max(0, Math.min(100, (completionRate * 100) - (overdueRate * 50)));

    // Calculate trends (simplified)
    const currentPeriodRate = completionTrend.slice(-7).reduce((sum, day) => sum + day.completionRate, 0) / 7;
    const previousPeriodRate = completionTrend.slice(-14, -7).reduce((sum, day) => sum + day.completionRate, 0) / 7;
    
    const avgVelocity = velocityData.reduce((sum, week) => sum + week.velocity, 0) / velocityData.length;
    
    const trends = {
      completionRate: currentPeriodRate - previousPeriodRate,
      velocity: avgVelocity,
      efficiency: productivityScore > 70 ? 5 : productivityScore > 50 ? 0 : -5
    };

    return {
      completionTrend,
      statusDistribution,
      priorityDistribution,
      velocityData,
      heatmapData,
      productivityScore: Math.round(productivityScore),
      trends
    } as AnalyticsData;
  }, [tasks, timeRange]);
};
