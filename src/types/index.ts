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
  tags?: string[];
  comments?: Comment[];
  cost?: number;  // New field for task cost
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
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
  budget?: number;  // New field
  budgetSpent?: number;  // New field
}

export interface DailyScore {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  date: Date;
}
