import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeeActionsPage as EmployeeActionsPageComponent } from '@/components/employee-actions/EmployeeActionsPage';

const EmployeeActionsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow access to all authenticated users - they can at least view their own actions
  return <EmployeeActionsPageComponent />;
};

export default EmployeeActionsPage;