export interface AssignmentRule {
  id: string;
  organization_id: string;
  request_type_id: string;
  rule_name: string;
  rule_type: string;
  conditions: any;
  assignment_strategy: string;
  escalation_rules: any;
  is_active: boolean;
  priority_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalWorkflow {
  id: string;
  organization_id: string;
  request_type_id: string;
  workflow_name: string;
  approval_levels: any;
  workflow_type: string;
  timeout_hours: number;
  auto_escalate: boolean;
  delegation_allowed: boolean;
  emergency_override_roles: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RequestDelegation {
  id: string;
  organization_id: string;
  request_id: string;
  original_approver_id: string;
  delegate_approver_id: string;
  delegation_reason?: string;
  delegated_at: string;
  expires_at?: string;
  is_active: boolean;
}