
import { useMemo } from 'react';
import { Task } from '@/types';

export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function useTeamPerformanceChartData(tasks: Task[]) {
  return useMemo<ChartDataItem[]>(() => {
    const assignedTasks = tasks.filter(task => task.assignedToId);
    // Group by assignee
    const groupedByAssignee = assignedTasks.reduce((acc, task) => {
      const assigneeName = task.assignedToName || 'Unassigned';
      if (!acc[assigneeName]) {
        acc[assigneeName] = {
          total: 0,
          completed: 0
        };
      }
      acc[assigneeName].total++;
      if (task.status === 'Completed') {
        acc[assigneeName].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);
    // Convert to chart data
    return Object.entries(groupedByAssignee).map(([name, data], index) => ({
      name,
      value: data.completed,
      color: COLORS[index % COLORS.length]
    })).filter(item => item.value > 0);
  }, [tasks]);
}
