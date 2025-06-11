
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
  description: string; // Made required to match Task type
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

export interface FlatComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
  taskId: string;
}

// Raw database row types for data mapping
export interface RawTaskRow {
  id: string;
  user_id?: string;
  project_id?: string;
  title?: string;
  description?: string;
  deadline?: string;
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'To Do' | 'In Progress' | 'Pending' | 'Completed';
  created_at?: string;
  updated_at?: string;
  assigned_to_id?: string;
  assigned_to_ids?: string[];
  assigned_to_names?: string[];
  cost?: number;
  organization_id?: string;
}

export interface RawProjectRow {
  id: string;
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  manager_id?: string;
  created_at?: string;
  updated_at?: string;
  team_members?: string[];
  budget?: number;
  budget_spent?: number;
  is_completed?: boolean;
  status?: 'To Do' | 'In Progress' | 'Completed';
  tasks_count?: number;
  tags?: string[];
  organization_id?: string;
}

export interface RawCommentRow {
  id: string;
  user_id: string;
  task_id: string;
  content: string;
  created_at?: string;
}
