
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

// Simple raw database types to avoid complex inference
export interface RawTask {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  description?: string;
  deadline?: string;
  priority?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  assigned_to_id?: string;
  assigned_to_ids?: string[];
  assigned_to_names?: string[];
  cost?: number;
}

export interface RawProject {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  manager_id: string;
  budget?: number;
  budget_spent?: number;
  created_at?: string;
  updated_at?: string;
  team_members?: string[];
  is_completed?: boolean;
  status?: string;
  tasks_count?: number;
  tags?: string[];
}

export interface RawComment {
  id: string;
  user_id: string;
  task_id: string;
  content: string;
  created_at: string;
}
