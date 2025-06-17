
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading, isAuthenticated } = useAuth();

  console.log('Index page - Loading:', loading, 'User:', !!user, 'IsAuthenticated:', isAuthenticated);

  // Show loading only while auth is initializing
  if (loading) {
    console.log('Index: Showing loading state during auth initialization');
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
          <p className="text-xs text-muted-foreground/60 mt-2">If this takes too long, try refreshing the page</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated && user) {
    console.log('Index: User is authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // For all other cases (unauthenticated users), show landing page
  console.log('Index: Showing landing page');
  return <LandingPage />;
};

export default Index;
