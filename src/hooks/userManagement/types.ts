
import { UserRole } from '@/types';

export interface EnhancedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization_id: string;
  created_at: string;
  assigned_tasks_count: number;
  completed_tasks_count: number;
  role_level: number;
  last_activity?: string;
  is_active: boolean;
}

export interface UserImpactAnalysis {
  user_info: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tasks_assigned: number;
  project_tasks_assigned: number;
  projects_managed: number;
  chat_rooms_created: number;
  team_memberships: number;
  is_sole_superadmin: boolean;
  can_be_deleted: boolean;
  deletion_blocked_reason?: string;
}

export interface RoleChangeValidation {
  allowed: boolean;
  requires_transfer?: boolean;
  current_superadmin_id?: string;
  current_superadmin_name?: string;
  reason?: string;
}

export interface SuperadminTransferData {
  targetUserId: string;
  targetUserName: string;
  currentSuperadminId: string;
  currentSuperadminName: string;
}

export interface TransferResponse {
  success: boolean;
  error?: string;
  message?: string;
}
