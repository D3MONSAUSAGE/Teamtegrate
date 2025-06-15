
// RLS Validation Utilities
// This module provides client-side validation to complement server-side RLS policies

import { useAuth } from '@/contexts/AuthContext';

export interface DataAccessValidation {
  isValid: boolean;
  reason?: string;
  severity: 'info' | 'warning' | 'error';
}

export const validateTaskAccess = (
  task: any,
  currentUserId: string,
  userRole: string,
  organizationId: string
): DataAccessValidation => {
  // Organization validation
  if (task.organization_id !== organizationId) {
    return {
      isValid: false,
      reason: 'Task belongs to different organization',
      severity: 'error'
    };
  }

  // Admin/superadmin access
  if (userRole === 'admin' || userRole === 'superadmin') {
    return {
      isValid: true,
      reason: 'Admin access granted',
      severity: 'info'
    };
  }

  // Task creator access
  if (task.user_id === currentUserId) {
    return {
      isValid: true,
      reason: 'Task creator access',
      severity: 'info'
    };
  }

  // Single assignee access
  if (task.assigned_to_id === currentUserId) {
    return {
      isValid: true,
      reason: 'Single assignee access',
      severity: 'info'
    };
  }

  // Multiple assignee access
  if (task.assigned_to_ids && Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.includes(currentUserId)) {
    return {
      isValid: true,
      reason: 'Multiple assignee access',
      severity: 'info'
    };
  }

  return {
    isValid: false,
    reason: 'No valid access found for task',
    severity: 'warning'
  };
};

export const validateProjectAccess = (
  project: any,
  currentUserId: string,
  userRole: string,
  organizationId: string
): DataAccessValidation => {
  // Organization validation
  if (project.organization_id !== organizationId) {
    return {
      isValid: false,
      reason: 'Project belongs to different organization',
      severity: 'error'
    };
  }

  // Admin/superadmin access
  if (userRole === 'admin' || userRole === 'superadmin') {
    return {
      isValid: true,
      reason: 'Admin access granted',
      severity: 'info'
    };
  }

  // Project manager access
  if (project.manager_id === currentUserId) {
    return {
      isValid: true,
      reason: 'Project manager access',
      severity: 'info'
    };
  }

  // Team member access
  if (project.team_members && Array.isArray(project.team_members) && project.team_members.includes(currentUserId)) {
    return {
      isValid: true,
      reason: 'Team member access',
      severity: 'info'
    };
  }

  return {
    isValid: false,
    reason: 'No valid access found for project',
    severity: 'warning'
  };
};

export const logDataAccess = (
  entityType: 'task' | 'project',
  entityId: string,
  validation: DataAccessValidation,
  userId: string,
  userRole: string
) => {
  const logLevel = validation.severity === 'error' ? 'error' : 
                  validation.severity === 'warning' ? 'warn' : 'log';
  
  console[logLevel](`RLS_VALIDATION: ${entityType.toUpperCase()} ACCESS`, {
    entityType,
    entityId,
    userId,
    userRole,
    isValid: validation.isValid,
    reason: validation.reason,
    severity: validation.severity,
    timestamp: new Date().toISOString()
  });
};

export const useDataAccessValidation = () => {
  const { user } = useAuth();

  const validateTaskAccessWithUser = (task: any) => {
    if (!user) {
      return {
        isValid: false,
        reason: 'User not authenticated',
        severity: 'error' as const
      };
    }

    return validateTaskAccess(task, user.id, user.role, user.organizationId);
  };

  const validateProjectAccessWithUser = (project: any) => {
    if (!user) {
      return {
        isValid: false,
        reason: 'User not authenticated',
        severity: 'error' as const
      };
    }

    return validateProjectAccess(project, user.id, user.role, user.organizationId);
  };

  return {
    validateTaskAccess: validateTaskAccessWithUser,
    validateProjectAccess: validateProjectAccessWithUser,
    logDataAccess,
    user
  };
};
