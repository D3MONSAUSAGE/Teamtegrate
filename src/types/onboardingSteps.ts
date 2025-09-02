// Enhanced onboarding step types
export type OnboardingStepType = 
  | 'document' 
  | 'course' 
  | 'quiz' 
  | 'video' 
  | 'task' 
  | 'meeting' 
  | 'approval';

export type OnboardingStepContentType = 
  | 'text' 
  | 'video' 
  | 'document' 
  | 'external_link';

export type OnboardingStepRequirementType = 
  | 'course' 
  | 'quiz' 
  | 'document_upload' 
  | 'approval';

export type OnboardingStepProgressStatus = 
  | 'locked' 
  | 'available' 
  | 'in_progress' 
  | 'completed' 
  | 'skipped';

export interface OnboardingStep {
  id: string;
  template_id: string;
  stage_id?: string;
  organization_id: string;
  title: string;
  description?: string;
  step_type: OnboardingStepType;
  order_index: number;
  is_required: boolean;
  estimated_duration_minutes?: number;
  due_offset_days?: number;
  prerequisites: string[]; // Array of step IDs
  created_at: string;
  updated_at: string;
  content?: OnboardingStepContent[];
  requirements?: OnboardingStepRequirement[];
}

export interface OnboardingStepContent {
  id: string;
  step_id: string;
  organization_id: string;
  content_type: OnboardingStepContentType;
  content_data: Record<string, any>; // Store URLs, text, etc.
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStepRequirement {
  id: string;
  step_id: string;
  organization_id: string;
  requirement_type: OnboardingStepRequirementType;
  requirement_id?: string; // ID of course, quiz, etc.
  requirement_data?: Record<string, any>;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingInstanceStepProgress {
  id: string;
  instance_id: string;
  step_id: string;
  employee_id: string;
  organization_id: string;
  status: OnboardingStepProgressStatus;
  started_at?: string;
  completed_at?: string;
  completion_data?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
  step?: OnboardingStep;
}

// Form types for creating/editing steps
export interface OnboardingStepFormData {
  title: string;
  description?: string;
  step_type: OnboardingStepType;
  is_required: boolean;
  estimated_duration_minutes?: number;
  due_offset_days?: number;
  prerequisites: string[];
  content: Array<{
    content_type: OnboardingStepContentType;
    content_data: Record<string, any>;
  }>;
  requirements: Array<{
    requirement_type: OnboardingStepRequirementType;
    requirement_id?: string;
    requirement_data?: Record<string, any>;
    is_required: boolean;
  }>;
}

// Journey types for employee interface
export interface OnboardingJourney {
  instance: {
    id: string;
    employee_id: string;
    template?: {
      id: string;
      name: string;
      description?: string;
    };
  };
  stages: Array<{
    id: string;
    title: string;
    description?: string;
    order_index: number;
    steps: OnboardingInstanceStepProgress[];
  }>;
  currentStep?: OnboardingInstanceStepProgress;
  progress: {
    totalSteps: number;
    completedSteps: number;
    availableSteps: number;
    completionPercentage: number;
  };
}