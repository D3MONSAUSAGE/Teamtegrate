
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';

const Index = () => {
  const { user, loading, isAuthenticated } = useAuth();

  console.log('🏠 Index page - Loading:', loading, 'User:', !!user, 'IsAuthenticated:', isAuthenticated);

  // Show landing page immediately while auth is loading for better UX
  if (loading) {
    console.log('🏠 Index: Auth loading, showing landing page with no auth required');
    return <LandingPage />;
  }

  // If user is fully authenticated with all required data, redirect to dashboard
  if (isAuthenticated && user && user.organizationId) {
    console.log('🏠 Index: User fully authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // If user is authenticated but missing organization, redirect to dashboard anyway
  // The dashboard will handle showing appropriate messages
  if (isAuthenticated && user) {
    console.log('🏠 Index: User authenticated but incomplete data, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // For unauthenticated users or auth errors, show landing page
  console.log('🏠 Index: Showing landing page for unauthenticated/error state');
  return <LandingPage />;
};

export default Index;
