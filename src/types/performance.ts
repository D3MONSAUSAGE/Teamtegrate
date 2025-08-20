
export interface TeamMemberPerformance {
  id: string;
  name: string;
  email: string;
  role: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  dueTodayTasks: number;
  projects: number;
}
