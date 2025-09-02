export type ActionType = 
  | 'verbal_warning' 
  | 'written_warning' 
  | 'final_warning' 
  | 'performance_coaching' 
  | 'behavioral_coaching' 
  | 'career_coaching' 
  | 'compliance_coaching';

export type ActionSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ActionCategory = 
  | 'attendance' 
  | 'performance' 
  | 'policy_violation' 
  | 'safety' 
  | 'customer_service' 
  | 'team_collaboration' 
  | 'professional_conduct' 
  | 'other';

export type ActionStatus = 'active' | 'completed' | 'escalated' | 'appealed';

export type ParticipantType = 'issuer' | 'recipient' | 'witness' | 'supervisor' | 'hr_rep';

export type SignatureStatus = 'pending' | 'signed' | 'declined';

export type FollowUpStatus = 'scheduled' | 'completed' | 'rescheduled' | 'cancelled';

export interface EmployeeAction {
  id: string;
  organization_id: string;
  recipient_id: string;
  issued_by: string;
  action_type: ActionType;
  severity: ActionSeverity;
  category: ActionCategory;
  title: string;
  description: string;
  improvement_plan?: string;
  expected_outcomes?: string;
  follow_up_date?: string;
  status: ActionStatus;
  is_confidential: boolean;
  team_id?: string;
  job_role_context?: Record<string, any>;
  created_at: string;
  updated_at: string;
  due_date?: string;
  completed_at?: string;
  escalation_count: number;
  appeal_submitted_at?: string;
  appeal_reason?: string;
  
  // Joined data
  recipient_name?: string;
  recipient_email?: string;
  issuer_name?: string;
  issuer_email?: string;
  team_name?: string;
}

export interface ActionParticipant {
  id: string;
  action_id: string;
  organization_id: string;
  user_id: string;
  participant_type: ParticipantType;
  signature_status: SignatureStatus;
  signed_at?: string;
  notes?: string;
  created_at: string;
  
  // Joined data
  user_name?: string;
  user_email?: string;
}

export interface ActionFollowUp {
  id: string;
  action_id: string;
  organization_id: string;
  conducted_by: string;
  follow_up_date: string;
  status: FollowUpStatus;
  progress_rating?: number;
  progress_notes: string;
  next_steps?: string;
  next_follow_up_date?: string;
  is_improvement_shown: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined data
  conductor_name?: string;
  conductor_email?: string;
}

export interface ActionTemplate {
  id: string;
  organization_id: string;
  created_by: string;
  template_name: string;
  action_type: ActionType;
  category: ActionCategory;
  title_template: string;
  description_template: string;
  improvement_plan_template?: string;
  expected_outcomes_template?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  
  // Joined data
  creator_name?: string;
}

export interface CreateEmployeeActionData {
  recipient_id: string;
  action_type: ActionType;
  severity: ActionSeverity;
  category: ActionCategory;
  title: string;
  description: string;
  improvement_plan?: string;
  expected_outcomes?: string;
  follow_up_date?: string;
  is_confidential?: boolean;
  team_id?: string;
  job_role_context?: Record<string, any>;
  due_date?: string;
}

export interface UpdateEmployeeActionData {
  title?: string;
  description?: string;
  improvement_plan?: string;
  expected_outcomes?: string;
  follow_up_date?: string;
  status?: ActionStatus;
  due_date?: string;
  completed_at?: string;
  appeal_reason?: string;
}

export interface CreateFollowUpData {
  action_id: string;
  follow_up_date: string;
  progress_notes: string;
  progress_rating?: number;
  next_steps?: string;
  next_follow_up_date?: string;
  is_improvement_shown?: boolean;
}

export interface CreateTemplateData {
  template_name: string;
  action_type: ActionType;
  category: ActionCategory;
  title_template: string;
  description_template: string;
  improvement_plan_template?: string;
  expected_outcomes_template?: string;
}

export interface ActionStats {
  total_actions: number;
  active_actions: number;
  completed_actions: number;
  escalated_actions: number;
  by_type: Record<ActionType, number>;
  by_category: Record<ActionCategory, number>;
  by_severity: Record<ActionSeverity, number>;
  pending_follow_ups: number;
  overdue_actions: number;
}

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  verbal_warning: 'Verbal Warning',
  written_warning: 'Written Warning',
  final_warning: 'Final Warning',
  performance_coaching: 'Performance Coaching',
  behavioral_coaching: 'Behavioral Coaching',
  career_coaching: 'Career Development Coaching',
  compliance_coaching: 'Compliance Coaching'
};

export const ACTION_CATEGORY_LABELS: Record<ActionCategory, string> = {
  attendance: 'Attendance & Punctuality',
  performance: 'Performance Standards',
  policy_violation: 'Policy Violations',
  safety: 'Safety Concerns',
  customer_service: 'Customer Service',
  team_collaboration: 'Team Collaboration',
  professional_conduct: 'Professional Conduct',
  other: 'Other'
};

export const ACTION_SEVERITY_LABELS: Record<ActionSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  escalated: 'Escalated',
  appealed: 'Under Appeal'
};