// Onboarding System Types
export type OnboardingInstanceStatus = 'active' | 'completed' | 'on_hold' | 'cancelled';
export type OnboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type OnboardingTaskCategory = 'hr_documentation' | 'compliance_training' | 'job_specific_training' | 'culture_engagement';
export type OnboardingOwnerType = 'hr' | 'manager' | 'employee';
export type OnboardingFeedbackStatus = 'pending' | 'completed';

export interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  role_id?: string;
  is_active: boolean;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  stages?: OnboardingStage[];
  tasks?: OnboardingTask[];
}

export interface OnboardingStage {
  id: string;
  template_id: string;
  organization_id: string;
  title: string;
  description?: string;
  order_index: number;
  timeframe_label?: string;
  due_offset_days?: number;
  created_at: string;
  updated_at: string;
  tasks?: OnboardingTask[];
}

export interface OnboardingTask {
  id: string;
  template_id: string;
  stage_id?: string;
  organization_id: string;
  title: string;
  description?: string;
  category: OnboardingTaskCategory;
  owner_type: OnboardingOwnerType;
  due_offset_days?: number;
  resource_links: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OnboardingInstance {
  id: string;
  organization_id: string;
  template_id?: string;
  employee_id: string;
  status: OnboardingInstanceStatus;
  start_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  template?: OnboardingTemplate;
  tasks?: OnboardingInstanceTask[];
  feedback_checkpoints?: OnboardingFeedbackCheckpoint[];
  employee?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface OnboardingInstanceTask {
  id: string;
  instance_id: string;
  template_task_id?: string;
  organization_id: string;
  employee_id: string;
  title: string;
  description?: string;
  category?: OnboardingTaskCategory;
  owner_type: OnboardingOwnerType;
  status: OnboardingTaskStatus;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  assigned_to_user_id?: string;
  notes?: string;
  resource_links: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OnboardingFeedbackCheckpoint {
  id: string;
  instance_id: string;
  organization_id: string;
  employee_id: string;
  days_offset: number;
  checkpoint_label?: string;
  status: OnboardingFeedbackStatus;
  rating?: number;
  notes?: string;
  reviewer_id?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingProgress {
  instance: OnboardingInstance;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  daysRemaining?: number;
  currentStage?: OnboardingStage;
  upcomingTasks: OnboardingInstanceTask[];
  overdueTasks: OnboardingInstanceTask[];
}

// UI Types for forms and dialogs
export interface CreateOnboardingInstanceRequest {
  employee_id: string;
  template_id?: string;
  start_date?: string;
}

export interface CreateOnboardingTemplateRequest {
  name: string;
  description?: string;
  role_id?: string;
}

export interface OnboardingTaskFormData {
  title: string;
  description?: string;
  category: OnboardingTaskCategory;
  owner_type: OnboardingOwnerType;
  due_offset_days?: number;
  resource_links?: Record<string, any>;
  stage_id?: string;
}

export interface OnboardingStageFormData {
  title: string;
  description?: string;
  timeframe_label?: string;
  due_offset_days?: number;
  order_index?: number;
}