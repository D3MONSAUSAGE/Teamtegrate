import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControlData } from './useAccessControlData';
import type { RequestType } from '@/types/requests';
import type { SystemRole } from './useAccessControlData';

interface PermissionRequirement {
  module_id: string;
  action_id: string;
}

export const useRequestPermissions = () => {
  const { user } = useAuth();
  const { grantsForRole, grantsForJobRole, grantsForUser } = useAccessControlData();

  const checkPermission = useMemo(() => {
    return (moduleId: string, actionId: string): boolean => {
      if (!user) return false;
      
      const userRole = user.role as SystemRole;
      const userId = user.id;
      
      // Check user-specific override first
      const userKey = `${moduleId}:${actionId}:${userId}`;
      const userOverride = grantsForUser.get(userKey);
      if (userOverride !== undefined) {
        return userOverride;
      }

      // Check job role permissions if user has job roles
      // TODO: Implement job role checking when user job roles are available
      
      // Check system role permissions
      const roleKey = `${moduleId}:${actionId}:${userRole}`;
      return grantsForRole.get(roleKey) ?? false;
    };
  }, [user, grantsForRole, grantsForJobRole, grantsForUser]);

  const canManageRequestTypes = useMemo(() => {
    return checkPermission('requests', 'manage_types');
  }, [checkPermission]);

  const canCreateRequest = useMemo(() => {
    return checkPermission('requests', 'create');
  }, [checkPermission]);

  const canApproveRequests = useMemo(() => {
    return checkPermission('requests', 'approve');
  }, [checkPermission]);

  const canViewAllRequests = useMemo(() => {
    return checkPermission('requests', 'view');
  }, [checkPermission]);

  const canAssignApprovers = useMemo(() => {
    return checkPermission('requests', 'assign_approvers');
  }, [checkPermission]);

  const canUseRequestType = useMemo(() => {
    return (requestType: RequestType): boolean => {
      if (!user) return false;

      // Check creator role restrictions
      if (requestType.creator_role_restrictions && requestType.creator_role_restrictions.length > 0) {
        if (!requestType.creator_role_restrictions.includes(user.role)) {
          return false;
        }
      }

      // Check required permissions
      if (requestType.required_permissions && Array.isArray(requestType.required_permissions)) {
        const requirements = requestType.required_permissions as PermissionRequirement[];
        return requirements.every(req => 
          checkPermission(req.module_id, req.action_id)
        );
      }

      // Default to basic create permission if no specific requirements
      return canCreateRequest;
    };
  }, [user, checkPermission, canCreateRequest]);

  const canViewRequestType = useMemo(() => {
    return (requestType: RequestType): boolean => {
      if (!user) return false;

      // Check viewer role restrictions
      if (requestType.viewer_role_restrictions && requestType.viewer_role_restrictions.length > 0) {
        if (!requestType.viewer_role_restrictions.includes(user.role)) {
          return false;
        }
      }

      // Default to view permission
      return canViewAllRequests || canUseRequestType(requestType);
    };
  }, [user, canViewAllRequests, canUseRequestType]);

  return {
    checkPermission,
    canManageRequestTypes,
    canCreateRequest,
    canApproveRequests,
    canViewAllRequests,
    canAssignApprovers,
    canUseRequestType,
    canViewRequestType
  };
};