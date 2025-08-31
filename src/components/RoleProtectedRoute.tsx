import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { UserRole } from '@/types';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  redirectTo?: string;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/dashboard'
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user || !hasRoleAccess(user.role, requiredRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};