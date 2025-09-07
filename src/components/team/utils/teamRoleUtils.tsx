import React from 'react';
import { Crown, Shield, User } from 'lucide-react';

export type TeamRole = 'manager' | 'admin' | 'member';

export const getTeamRoleIcon = (role: TeamRole) => {
  switch (role) {
    case 'manager':
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case 'admin':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'member':
      return <User className="h-4 w-4 text-green-500" />;
    default:
      return <User className="h-4 w-4 text-gray-500" />;
  }
};

export const getTeamRoleBadgeVariant = (role: TeamRole) => {
  switch (role) {
    case 'manager':
      return 'default';
    case 'admin':
      return 'destructive';
    case 'member':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const getTeamRoleHierarchy = (role: TeamRole): number => {
  switch (role) {
    case 'manager':
      return 3;
    case 'admin':
      return 2;
    case 'member':
      return 1;
    default:
      return 0;
  }
};

export const getTeamRoleDisplayName = (role: TeamRole): string => {
  switch (role) {
    case 'manager':
      return 'Manager';
    case 'admin':
      return 'Admin';
    case 'member':
      return 'Member';
    default:
      return 'Unknown';
  }
};

export const canAssignRole = (assignerRole: TeamRole, targetRole: TeamRole): boolean => {
  const assignerLevel = getTeamRoleHierarchy(assignerRole);
  const targetLevel = getTeamRoleHierarchy(targetRole);
  
  // Can only assign roles at or below your level
  return assignerLevel >= targetLevel;
};

export const getNextRole = (currentRole: TeamRole): TeamRole => {
  switch (currentRole) {
    case 'member':
      return 'admin';
    case 'admin':
      return 'manager';
    case 'manager':
      return 'member';
    default:
      return 'member';
  }
};

export const getPreviousRole = (currentRole: TeamRole): TeamRole => {
  switch (currentRole) {
    case 'manager':
      return 'admin';
    case 'admin':
      return 'member';
    case 'member':
      return 'manager';
    default:
      return 'member';
  }
};

export const getAllowedRoleTransitions = (currentRole: TeamRole): TeamRole[] => {
  switch (currentRole) {
    case 'manager':
      return ['admin', 'member'];
    case 'admin':
      return ['manager', 'member'];
    case 'member':
      return ['admin', 'manager'];
    default:
      return [];
  }
};