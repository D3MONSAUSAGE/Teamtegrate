
export type UserRole = 'user' | 'manager';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
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

// Alias for TaskComment to fix existing imports
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
  completedById?: string;
  completedByName?: string;
  tags?: string[];
  comments?: TaskComment[];
  cost?: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  managerId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: Task[];
  teamMembers?: string[];
  tags?: string[];
  budget?: number;
  budgetSpent?: number;
  is_completed?: boolean;
}

export interface DailyScore {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  date: Date;
}
