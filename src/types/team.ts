
import { Task } from '@/types';

/**
 * Basic team member information
 */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  managerId: string;
}

/**
 * Extended team member with performance metrics
 */
export interface TeamMemberPerformance extends TeamMember {
  assignedTasks: Task[];
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  dueTodayTasks: number;
  projects: number;
  projectIds: string[]; // Store actual project IDs
}
