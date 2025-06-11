
// Type definitions for flat task structures
export interface FlatTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  deadline: Date; // Changed from string to Date
  userId: string;
  projectId?: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedToIds?: string[];
  assignedToNames?: string[];
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  cost?: number;
}

export interface FlatProject {
  id: string;
  title: string;
  description?: string;
  status: string;
  managerId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlatUser {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  name?: string;
  timezone?: string;
  created_at: string;
  avatar_url?: string;
}

export interface FlatComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
  taskId: string;
}

// Raw database row types
export interface RawTaskRow {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  deadline: string;
  user_id: string;
  project_id?: string;
  assigned_to_id?: string;
  assigned_to_ids?: string[];
  assigned_to_names?: string[];
  created_at: string;
  updated_at: string;
  organization_id: string;
  cost?: number;
}

export interface RawProjectRow {
  id: string;
  title: string;
  description?: string;
  status: string;
  manager_id: string;
  start_date: string;
  end_date: string;
  team_members: string[];
  budget: number;
  budget_spent: number;
  is_completed: boolean;
  tasks_count: number;
  tags: string[];
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface RawCommentRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  task_id: string;
}
