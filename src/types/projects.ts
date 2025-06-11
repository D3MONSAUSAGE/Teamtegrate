
import { Task, ProjectStatus } from '@/types';

// Export the SimpleProject type for consistency across components
export interface SimpleProject {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  managerId: string;
  budget: number;
  budgetSpent?: number;
  createdAt: Date;
  updatedAt: Date;
  tasks: Task[];
  teamMembers: string[];
  is_completed: boolean;
  status: ProjectStatus;
  tasks_count: number;
  tags?: string[];
  organizationId?: string;
}

// Type alias for compatibility
export type CompatibleProject = SimpleProject;
