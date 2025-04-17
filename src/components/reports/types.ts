
export interface ProjectStatusData {
  name: string;
  total: number;
  completed: number;
  completionRate: number;
  isOverdue: boolean;
}

export interface ProjectTaskStatusData {
  name: string;
  'To Do': number;
  'In Progress': number;
  'Pending': number;
  'Completed': number;
}

export interface CompletionData {
  name: string;
  value: number;
}
