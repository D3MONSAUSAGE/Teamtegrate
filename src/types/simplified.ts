
// Simplified interfaces for context layers to avoid deep type instantiation

export interface SimpleUser {
  id: string;
  email: string;
  role: 'user' | 'manager' | 'admin' | 'superadmin';
  organization_id: string;
}

export interface SimpleTask {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  description: string;
  deadline: Date;
  priority: 'Low' | 'Medium' | 'High';
  status: 'To Do' | 'In Progress' | 'Completed';
  createdAt: Date;
  updatedAt: Date;
  assignedToId?: string;
  assignedToName?: string;
  assignedToIds?: string[];
  assignedToNames?: string[];
  comments?: Array<{
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: Date;
  }>;
  cost?: number;
}

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
  tasks: SimpleTask[];
  teamMembers: string[];
  is_completed: boolean;
  status: 'To Do' | 'In Progress' | 'Completed';
  tasks_count: number;
  tags?: string[];
  organizationId?: string;
}

export interface SimpleDailyScore {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  date: Date;
}
