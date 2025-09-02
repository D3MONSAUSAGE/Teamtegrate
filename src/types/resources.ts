export type ResourceType = 'document' | 'video' | 'link' | 'image' | 'template';
export type ResourceCategory = 'hr_documentation' | 'compliance_training' | 'job_specific_training' | 'culture_engagement' | 'general';

export interface OnboardingResource {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  resource_type: ResourceType;
  category: ResourceCategory;
  tags: string[];
  is_public: boolean;
  external_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingTaskResource {
  id: string;
  task_id: string;
  resource_id: string;
  is_required: boolean;
  created_at: string;
  resource?: OnboardingResource;
}

export interface CreateResourceRequest {
  title: string;
  description?: string;
  resource_type: ResourceType;
  category: ResourceCategory;
  tags?: string[];
  is_public?: boolean;
  external_url?: string;
  file?: File;
}

export interface ResourceFilterOptions {
  category?: ResourceCategory;
  resource_type?: ResourceType;
  tags?: string[];
  search?: string;
}