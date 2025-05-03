
// Team Member Performance interfaces
export interface TeamMemberPerformance {
  id: string;
  name: string;
  email: string;
  role: string;
  managerId: string;
  assignedTasks: any[];
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  dueTodayTasks: number;
  projects: number;
}

export interface PerformanceChartData {
  name: string;
  assignedTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface ProductivityTrendData {
  name: string;
  [key: string]: string | number;
}

export interface SkillMatrixData {
  subject: string;
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}
