
import React from 'react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';

const Index = () => {
  const { user, loading, isAuthenticated } = useAuth();

  console.log('Index page - Auth state:', { 
    loading, 
    hasUser: !!user, 
    isAuthenticated,
    userEmail: user?.email 
  });

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated && user && !loading) {
    console.log('Index: User is authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // For everyone else (including during loading), show landing page
  console.log('Index: Showing landing page');
  return <LandingPage />;
};

export default Index;
