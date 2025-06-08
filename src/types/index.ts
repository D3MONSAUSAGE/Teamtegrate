
export type UserRole = 'superadmin' | 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  avatar_url?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';

export type TaskStatus = 'To Do' | 'In Progress' | 'Pending' | 'Completed';

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
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
  tasks: Task[];
  teamMembers: string[];
  budget: number;
  budgetSpent?: number;
  is_completed: boolean;
  status: ProjectStatus;
  tasks_count: number;
  tags?: string[];
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
}

export interface TeamMemberPerformance {
  id: string;
  name: string;
  completedTasks: number;
  completionRate: number;
  projects: number;
}

// Role hierarchy utility functions
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'superadmin': 4,
  'admin': 3,
  'manager': 2,
  'user': 1
};

export const hasRoleAccess = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const canManageUser = (managerRole: UserRole, targetRole: UserRole): boolean => {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
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
