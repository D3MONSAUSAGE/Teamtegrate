
import { TaskStatus, TaskPriority } from '@/types';

export interface StatusDistributionData {
  name: string;
  value: number;
}

export interface PriorityDistributionData {
  name: string;
  value: number;
}

export interface CompletionTrendData {
  date: string;
  completed: number;
  total: number;
}

export interface ChartColors {
  [key: string]: string;
}

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  'Low': '#00C49F',
  'Medium': '#FFBB28',
  'High': '#FF8042'
};
