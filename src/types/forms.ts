
// Standardized form interfaces to replace any types
export interface TaskFormData {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  deadline: Date;
  projectId?: string;
  assignedToIds: string[];
  cost?: number;
}

export interface ProjectFormData {
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  managerId?: string;
  teamMemberIds?: string[];
}

export interface UserFormData {
  name: string;
  email: string;
  role: string;
}

export interface FormSubmissionCallback<T> {
  (data: T): Promise<void> | void;
}

export interface FormErrorHandler {
  (error: Error | string): void;
}
