
// Simplified type definitions for API responses
export interface SimplifiedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  projectId?: string;
  assignedToId?: string;
}

export interface SimplifiedProject {
  id: string;
  title: string;
  status: string;
  managerId: string;
}

export interface SimplifiedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Add missing exports
export interface SimpleUser {
  id: string;
  organization_id: string;
  email: string;
  role: 'user' | 'manager' | 'admin' | 'superadmin';
}

export interface RawTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  deadline: string;
  user_id: string;
  project_id?: string;
  assigned_to_id?: string;
  assigned_to_names?: string[];
  created_at: string;
  updated_at: string;
  organization_id: string;
  cost?: number;
}

export interface RawComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  task_id: string;
}
