
export type UserRole = 'superadmin' | 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string; // Made required and consistent naming
  name?: string;
  timezone?: string;
  createdAt: Date;
  avatar_url?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';

export type TaskStatus = 'To Do' | 'In Progress' | 'Completed';

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
  organizationId: string; // Made required
}

export type Comment = TaskComment;

export interface Task {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  description: string;
  deadline: Date;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  assignedToId?: string;
  assignedToName?: string;
  assignedToIds?: string[];
  assignedToNames?: string[];
  completedById?: string;
  completedByName?: string;
  tags?: string[];
  comments?: TaskComment[];
  cost?: number;
  organizationId: string; // Made required
}

export type ProjectStatus = 'To Do' | 'In Progress' | 'Completed';

export interface Project {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  managerId: string;
  createdAt: Date;
  updatedAt: Date;
  teamMemberIds: string[]; // Unified naming - use teamMemberIds consistently
  budget: number;
  budgetSpent: number; // Made required, defaulting to 0
  isCompleted: boolean; // Changed from is_completed to isCompleted
  status: ProjectStatus;
  tasksCount: number; // Changed from tasks_count to tasksCount
  tags: string[]; // Made required, defaulting to empty array
  organizationId: string; // Made required
}

export interface DailyScore {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  date: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  managerId: string;
  organizationId: string; // Made required
}

export interface TeamMemberPerformance {
  id: string;
  name: string;
  completedTasks: number;
  completionRate: number;
  projects: number;
  organizationId: string; // Made required
}

export interface Organization {
  id: string;
  name: string;
  created_by: string;
  created_at: Date;
}

export interface ChatRoom {
  id: string;
  name: string;
  created_by: string;
  created_at: Date;
  organizationId: string; // Made required
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  type: 'text' | 'file' | 'image';
  created_at: Date;
  parent_id?: string;
  organizationId: string; // Made required
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  type: string;
  read: boolean;
  created_at: Date;
  task_id?: string;
  event_id?: string;
  organizationId: string; // Made required
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type: string;
  size_bytes: number;
  user_id: string;
  folder?: string;
  storage_id: string;
  created_at: Date;
  organizationId: string; // Made required
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  organizationId: string; // Made required
}

export interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: Date;
  clock_out?: Date;
  duration_minutes?: number;
  notes?: string;
  created_at: Date;
  organizationId: string; // Made required
}

// Role hierarchy utility functions
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'superadmin': 4,
  'admin': 3,
  'manager': 2,
  'user': 1
};

export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'superadmin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'manager':
      return 'Manager';
    case 'user':
      return 'Team Member';
    default:
      return 'Unknown';
  }
};
