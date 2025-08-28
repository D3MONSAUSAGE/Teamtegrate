
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  console.log('🔒 PROTECTED ROUTE: Checking auth state:', { 
    isAuthenticated, 
    loading
  });

  if (loading) {
    console.log('🔒 PROTECTED ROUTE: Loading state - showing nothing');
    // Show nothing or loading indicator
    return null;
  }

  if (!isAuthenticated) {
    console.log('🔒 PROTECTED ROUTE: Not authenticated - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('🔒 PROTECTED ROUTE: Authenticated - rendering children');
  return <>{children}</>;
}
