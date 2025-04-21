
export type ChecklistFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export type ChecklistItemStatus = 'pending' | 'completed' | 'skipped' | 'failed';

export interface ChecklistItem {
  id: string;
  text: string;
  status: ChecklistItemStatus;
  notes?: string;
  completedAt?: Date;
  completedBy?: string;
  requiredPhoto?: boolean;
  photoUrl?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface ExecutionWindow {
  startDate: Date | null;
  endDate: Date | null;
  startTime?: string;
  endTime?: string;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  description?: string;
  sections: ChecklistSection[];
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  branchOptions?: string[];
  frequency?: ChecklistFrequency;
  lastGenerated?: Date;
}

export interface Checklist extends Omit<ChecklistTemplate, 'branchOptions'> {
  templateId?: string;
  dueDate?: Date;
  startDate: Date;
  branch?: string;
  assignedTo: string[];
  status: 'draft' | 'in-progress' | 'completed';
  progress: number;
  completedCount: number;
  totalCount: number;
  executionWindow?: ExecutionWindow;
}

export interface ChecklistReport {
  id: string;
  title: string;
  period: 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  checklists: Checklist[];
  createdAt: Date;
  createdBy: string;
  completionRate: number;
  failureCount: number;
  branches: string[];
}
