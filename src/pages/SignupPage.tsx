
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SignupPage = () => {
  const { user } = useAuth();

  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // For now, redirect to login page since we don't have a signup flow
  return <Navigate to="/login" replace />;
};

export default SignupPage;
