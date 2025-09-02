// Types for the onboarding document management system

export type DocumentType = 'i9' | 'w4' | 'emergency_contact' | 'direct_deposit' | 'policy_acknowledgment' | 'custom';
export type SubmissionStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'needs_revision';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ComplianceType = 'i9_verification' | 'tax_forms' | 'emergency_contacts' | 'policy_acknowledgments' | 'background_check' | 'drug_screening';
export type ComplianceStatus = 'pending' | 'in_progress' | 'completed' | 'not_applicable';

export interface OnboardingDocumentRequirement {
  id: string;
  organization_id: string;
  template_id?: string;
  name: string;
  description?: string;
  document_type: DocumentType;
  is_required: boolean;
  due_days_after_start: number;
  instructions?: string;
  allowed_file_types: string[];
  max_file_size_mb: number;
  requires_approval: boolean;
  approver_roles: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingDocumentSubmission {
  id: string;
  organization_id: string;
  instance_id: string;
  requirement_id: string;
  employee_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  submission_status: SubmissionStatus;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewer_notes?: string;
  rejection_reason?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  requirement?: OnboardingDocumentRequirement;
  employee?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface OnboardingApproval {
  id: string;
  organization_id: string;
  submission_id: string;
  approver_id: string;
  approval_status: ApprovalStatus;
  approved_at?: string;
  notes?: string;
  created_at: string;
  // Relationships
  submission?: OnboardingDocumentSubmission;
  approver?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface OnboardingComplianceItem {
  id: string;
  organization_id: string;
  instance_id: string;
  compliance_type: ComplianceType;
  status: ComplianceStatus;
  due_date?: string;
  completed_date?: string;
  completed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  instance?: {
    id: string;
    employee_id: string;
    employee?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

// Request types for forms
export interface CreateDocumentRequirementRequest {
  name: string;
  description?: string;
  document_type: DocumentType;
  is_required?: boolean;
  due_days_after_start?: number;
  instructions?: string;
  allowed_file_types?: string[];
  max_file_size_mb?: number;
  requires_approval?: boolean;
  approver_roles?: string[];
  template_id?: string;
}

export interface SubmitDocumentRequest {
  requirement_id: string;
  instance_id: string;
  file: File;
}

export interface ReviewSubmissionRequest {
  submission_id: string;
  status: SubmissionStatus;
  reviewer_notes?: string;
  rejection_reason?: string;
}

export interface UpdateComplianceRequest {
  compliance_item_id: string;
  status: ComplianceStatus;
  notes?: string;
}

// Dashboard/Analytics types
export interface OnboardingSubmissionStats {
  total_submissions: number;
  pending_review: number;
  approved: number;
  rejected: number;
  overdue: number;
  needs_revision: number;
}

export interface OnboardingComplianceStats {
  total_items: number;
  completed: number;
  pending: number;
  overdue: number;
  completion_rate: number;
}

export interface OnboardingDashboardData {
  submission_stats: OnboardingSubmissionStats;
  compliance_stats: OnboardingComplianceStats;
  recent_submissions: OnboardingDocumentSubmission[];
  pending_approvals: OnboardingDocumentSubmission[];
  overdue_items: (OnboardingDocumentSubmission | OnboardingComplianceItem)[];
}