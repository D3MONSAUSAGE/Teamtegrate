
import { Task, User } from '@/types';

export interface TaskPermissions {
  canView: boolean;
  canComment: boolean;
  canUpdateStatus: boolean;
  canEdit: boolean;
  accessReason: 'creator' | 'assigned' | 'project_manager' | 'project_member' | 'none';
}

export const getTaskPermissions = (
  task: Task,
  user: User,
  userProjects: any[],
  userRole: string = 'user'
): TaskPermissions => {
  const defaultPermissions: TaskPermissions = {
    canView: false,
    canComment: false,
    canUpdateStatus: false,
    canEdit: false,
    accessReason: 'none'
  };

  // If user is the task creator
  if (task.userId === user.id) {
    return {
      canView: true,
      canComment: true,
      canUpdateStatus: true,
      canEdit: true,
      accessReason: 'creator'
    };
  }

  // If user is directly assigned to the task
  const isDirectlyAssigned = task.assignedToId === user.id || 
    (task.assignedToIds && task.assignedToIds.includes(user.id));

  if (isDirectlyAssigned) {
    return {
      canView: true,
      canComment: true,
      canUpdateStatus: true,
      canEdit: false, // Can't edit unless creator
      accessReason: 'assigned'
    };
  }

  // Check project-based access
  if (task.projectId) {
    const project = userProjects.find(p => p.id === task.projectId);
    
    if (project) {
      // If user is project manager
      if (project.managerId === user.id) {
        return {
          canView: true,
          canComment: true,
          canUpdateStatus: true,
          canEdit: true, // Project managers can edit all project tasks
          accessReason: 'project_manager'
        };
      }

      // If user is project team member
      const isTeamMember = project.teamMembers?.includes(user.id);
      if (isTeamMember) {
        return {
          canView: true,
          canComment: true,
          canUpdateStatus: userRole === 'manager' || userRole === 'admin' || userRole === 'superadmin',
          canEdit: false,
          accessReason: 'project_member'
        };
      }
    }
  }

  // Admins and superadmins can do everything
  if (userRole === 'admin' || userRole === 'superadmin') {
    return {
      canView: true,
      canComment: true,
      canUpdateStatus: true,
      canEdit: true,
      accessReason: 'project_manager' // Treat as project manager level
    };
  }

  return defaultPermissions;
};

export const getAccessReasonText = (accessReason: TaskPermissions['accessReason']): string => {
  switch (accessReason) {
    case 'creator':
      return 'Task Creator';
    case 'assigned':
      return 'Assigned to Task';
    case 'project_manager':
      return 'Project Manager';
    case 'project_member':
      return 'Project Member';
    default:
      return '';
  }
};
