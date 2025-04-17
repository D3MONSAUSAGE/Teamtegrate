
export interface TeamMemberPerformance {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  projects: number;
}

export interface SkillMatrixItem {
  subject: string;
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

export interface ProductivityDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface TaskCategoryData {
  name: string;
  Development: number;
  Design: number;
  Planning: number;
  Testing: number;
  Documentation: number;
  [key: string]: string | number;
}
