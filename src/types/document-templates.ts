// Types for employee document template management system

export type ComplianceStatus = 'compliant' | 'missing' | 'expired' | 'expiring_soon' | 'pending_verification';

export interface EmployeeDocumentTemplate {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  requirements?: TemplateDocumentRequirement[];
}

export interface TemplateDocumentRequirement {
  id: string;
  template_id: string;
  document_name: string;
  document_type: string;
  is_required: boolean;
  requires_expiry: boolean;
  default_validity_days?: number;
  instructions?: string;
  allowed_file_types: string[];
  max_file_size_mb: number;
  display_order: number;
  created_at: string;
}

export interface EmployeeDocumentAssignment {
  id: string;
  organization_id: string;
  template_id: string;
  employee_id?: string;
  role?: string;
  team_id?: string;
  assigned_by: string;
  assigned_at: string;
  template?: EmployeeDocumentTemplate;
}

export interface DocumentComplianceTracking {
  employee_id: string;
  employee_name: string;
  employee_role: string;
  organization_id: string;
  requirement_id: string;
  document_name: string;
  is_required: boolean;
  requires_expiry: boolean;
  default_validity_days?: number;
  record_id?: string;
  file_path?: string;
  expiry_date?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  uploaded_at?: string;
  compliance_status: ComplianceStatus;
  template_name: string;
  template_id: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateRequirementRequest {
  template_id: string;
  document_name: string;
  document_type: string;
  is_required?: boolean;
  requires_expiry?: boolean;
  default_validity_days?: number;
  instructions?: string;
  allowed_file_types?: string[];
  max_file_size_mb?: number;
  display_order?: number;
}

export interface CreateAssignmentRequest {
  template_id: string;
  employee_id?: string;
  role?: string;
  team_id?: string;
}

export interface ComplianceMatrixData {
  employees: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  requirements: Array<{
    id: string;
    name: string;
    template_name: string;
  }>;
  compliance: Map<string, Map<string, DocumentComplianceTracking>>;
}

export interface ComplianceStats {
  total_requirements: number;
  compliant: number;
  missing: number;
  expired: number;
  expiring_soon: number;
  pending_verification: number;
  compliance_rate: number;
}
