
export interface User {
  id: string;
  email: string;
  name: string;
  role: import('./organization').UserRole;
  createdAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  start_date: string;
  end_date: string;
  manager_id: string;
  budget?: number;
  budget_spent?: number;
  is_completed: boolean;
  team_members: string[];
  tasks_count: number;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  deadline?: Date;
  assigned_to_id?: string;
  project_id?: string;
  user_id?: string;
  cost?: number;
  created_at?: Date;
  updated_at?: Date;
  completed_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  task_id?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  branch: string;
  uploader_name: string;
  invoice_date: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  organization_id: string;
  created_at: string;
}
