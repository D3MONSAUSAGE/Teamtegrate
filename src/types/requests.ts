export interface RequestType {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  parent_category_id?: string;
  form_schema: FormField[];
  requires_approval: boolean;
  approval_roles: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  required_permissions?: Array<{ module_id: string; action_id: string }> | null;
  creator_role_restrictions?: string[];
  viewer_role_restrictions?: string[];
  permission_metadata?: Record<string, any>;
  default_job_roles?: string[];
  selected_user_ids?: string[];
  expertise_tags?: string[];
}

export interface FormField {
  field: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'checkbox';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface Request {
  id: string;
  organization_id: string;
  request_type_id: string;
  requested_by: string;
  title: string;
  description?: string;
  form_data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'submitted' | 'under_review' | 'pending_acceptance' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  submitted_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  ticket_number?: string;
  assigned_to?: string;
  assigned_at?: string;
  accepted_by?: string;
  accepted_at?: string;
  completion_notes?: string;
  request_type?: RequestType;
  requested_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  assigned_to_user?: {
    id: string;
    name: string;
    email: string;
  };
  accepted_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RequestAttachment {
  id: string;
  organization_id: string;
  request_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export interface RequestApproval {
  id: string;
  organization_id: string;
  request_id: string;
  approver_id: string;
  approval_level: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at: string;
  approver?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface RequestComment {
  id: string;
  organization_id: string;
  request_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
  };
}

export const REQUEST_CATEGORIES = {
  time_schedule: 'Time & Schedule',
  hr_admin: 'HR & Administration',
  training: 'Training & Development',
  financial: 'Financial',
  it_access: 'IT & Access',
  custom: 'Custom'
} as const;

export const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
} as const;

export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  pending_acceptance: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800'
} as const;

export interface RequestUpdate {
  id: string;
  organization_id: string;
  request_id: string;
  user_id: string;
  update_type: 'progress' | 'status_change' | 'assignment';
  title: string;
  content?: string;
  old_status?: string;
  new_status?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
  };
}