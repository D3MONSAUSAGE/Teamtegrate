export type TerminationType = 'voluntary' | 'involuntary' | 'layoff' | 'retirement';
export type OffboardingStatus = 'pending' | 'in_progress' | 'completed';

export interface OffboardingRecord {
  id: string;
  organization_id: string;
  user_id: string;
  initiated_by: string | null;
  initiated_at: string;
  termination_date: string;
  last_day_worked: string | null;
  termination_type: TerminationType;
  termination_reason: string | null;
  eligible_for_rehire: boolean;
  offboarding_notes: string | null;
  status: OffboardingStatus;
  completed_at: string | null;
  completed_by: string | null;
  
  // Checklist items
  access_revoked: boolean;
  access_revoked_at: string | null;
  equipment_returned: boolean;
  equipment_notes: string | null;
  exit_interview_completed: boolean;
  exit_interview_notes: string | null;
  final_payroll_processed: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface OffboardingFormData {
  termination_date: string;
  last_day_worked?: string;
  termination_type: TerminationType;
  termination_reason: string;
  eligible_for_rehire: boolean;
  offboarding_notes?: string;
  revoke_access_immediately: boolean;
}

export interface ChecklistUpdate {
  equipment_returned?: boolean;
  equipment_notes?: string;
  exit_interview_completed?: boolean;
  exit_interview_notes?: string;
  final_payroll_processed?: boolean;
}

export const terminationTypeLabels: Record<TerminationType, string> = {
  voluntary: 'Voluntary Resignation',
  involuntary: 'Involuntary Termination',
  layoff: 'Layoff',
  retirement: 'Retirement',
};
