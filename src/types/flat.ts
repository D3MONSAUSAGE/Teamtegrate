
// Flat types for use in context and state management
// These avoid deep type instantiation issues while maintaining type safety

export interface FlatUser {
  id: string;
  email: string;
  role: 'user' | 'manager' | 'admin' | 'superadmin';
  organization_id?: string;
}

export interface FlatTask {
  id: string;
  title: string;
  description?: string;
  deadline: Date;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Pending' | 'Completed';
  userId: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedToId?: string;
  assignedToName?: string;
  assignedToIds: string[];
  assignedToNames: string[];
  cost: number;
  organizationId: string;
}

export interface FlatProject {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  managerId: string;
  createdAt: Date;
  updatedAt: Date;
  teamMemberIds: string[];
  budget: number;
  budgetSpent: number;
  is_completed: boolean;
  status: 'To Do' | 'In Progress' | 'Completed';
  tasks_count: number;
  tags: string[];
  organizationId: string;
}
