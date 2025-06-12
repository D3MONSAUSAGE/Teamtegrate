
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';

const Index = () => {
  const { user, loading, isAuthenticated } = useAuth();

  console.log('Index page - Loading:', loading, 'User:', !!user, 'IsAuthenticated:', isAuthenticated);

  // If auth is still loading, show landing page immediately for better UX
  // Landing page should be publicly accessible regardless of auth state
  if (loading) {
    console.log('Index: Auth loading, showing landing page');
    return <LandingPage />;
  }

  // If user is authenticated and has all required data, redirect to dashboard
  if (isAuthenticated && user && user.organizationId) {
    console.log('Index: User is fully authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // If user is authenticated but missing organization, still redirect to dashboard
  // (the dashboard will handle the organization setup message)
  if (isAuthenticated && user) {
    console.log('Index: User authenticated but missing org data, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // For unauthenticated users, show landing page
  console.log('Index: Showing landing page for public user');
  return <LandingPage />;
};

export default Index;
