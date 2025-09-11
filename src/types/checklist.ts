export type ChecklistPriority = 'low' | 'medium' | 'high' | 'critical';
export type ChecklistStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type ExecutionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'verified';
export type AssignmentType = 'individual' | 'team' | 'role_based';

export interface Checklist {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  priority: ChecklistPriority;
  status: ChecklistStatus;
  assignment_type: AssignmentType;
  execution_window_start?: string;
  execution_window_end?: string;
  cutoff_time?: string;
  is_daily: boolean;
  branch_area?: string;
  shift_type?: string;
  scoring_enabled: boolean;
  verification_required: boolean;
  scheduled_days: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  organization_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_required: boolean;
  verification_required: boolean;
  created_at: string;
}

export interface ChecklistAssignment {
  id: string;
  checklist_id: string;
  organization_id: string;
  assigned_to_user_id?: string;
  assigned_to_team_id?: string;
  assigned_role?: string;
  created_by: string;
  created_at: string;
}

export interface ChecklistExecution {
  id: string;
  checklist_id: string;
  organization_id: string;
  assigned_to_user_id: string;
  execution_date: string;
  status: ExecutionStatus;
  started_at?: string;
  completed_at?: string;
  verified_at?: string;
  verified_by?: string;
  execution_score: number;
  verification_score: number;
  total_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  checklist?: Checklist;
  assigned_user?: { id: string; name: string; email: string };
  verifier?: { id: string; name: string; email: string };
}

export interface ChecklistExecutionItem {
  id: string;
  execution_id: string;
  checklist_item_id: string;
  organization_id: string;
  is_completed: boolean;
  completed_at?: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  checklist_item?: ChecklistItem;
  verifier?: { id: string; name: string; email: string };
}

export interface ChecklistComment {
  id: string;
  execution_item_id: string;
  organization_id: string;
  user_id: string;
  comment: string;
  is_verification_comment: boolean;
  created_at: string;
  // Relations
  user?: { id: string; name: string; email: string };
}

export interface ChecklistFormData {
  name: string;
  description: string;
  priority: ChecklistPriority;
  assignment_type: AssignmentType;
  execution_window_start: string;
  execution_window_end: string;
  cutoff_time?: string;
  branch_area: string;
  shift_type: string;
  verification_required: boolean;
  scoring_enabled: boolean;
  scheduled_days: string[];
  items: Array<{
    title: string;
    description: string;
    is_required: boolean;
    verification_required: boolean;
  }>;
  assignments: Array<{
    type: 'user' | 'team' | 'role';
    id: string;
    name: string;
  }>;
}