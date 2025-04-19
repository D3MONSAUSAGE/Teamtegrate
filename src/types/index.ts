
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
  is_completed?: boolean;  // Ensure this is optional
}
