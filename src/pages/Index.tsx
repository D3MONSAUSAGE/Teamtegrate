
import React from 'react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();

  console.log('Index page - Auth state:', { 
    loading, 
    isAuthenticated
  });

  // Show landing page while loading
  if (loading) {
    console.log('Index: Still loading auth state, showing landing page');
    return <LandingPage />;
  }

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    console.log('Index: User is authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // For unauthenticated users, show landing page
  console.log('Index: User not authenticated, showing landing page');
  return <LandingPage />;
};

export default Index;
