
import React from 'react';
import { UserRole } from '@/types';
import { Crown, Shield, UserCheck, User } from 'lucide-react';

export const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'superadmin':
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case 'admin':
      return <Shield className="h-4 w-4 text-orange-500" />;
    case 'manager':
      return <UserCheck className="h-4 w-4 text-blue-500" />;
    case 'user':
      return <User className="h-4 w-4 text-green-500" />;
    default:
      return <User className="h-4 w-4 text-gray-500" />;
  }
};

export const getRoleBadgeVariant = (role: UserRole) => {
  switch (role) {
    case 'superadmin':
      return 'default';
    case 'admin':
      return 'destructive';
    case 'manager':
      return 'secondary';
    case 'user':
      return 'outline';
    default:
      return 'outline';
  }
};
