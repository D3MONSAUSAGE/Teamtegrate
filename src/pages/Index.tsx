
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading, isAuthenticated } = useAuth();

  console.log('Index page - Loading:', loading, 'User:', !!user, 'IsAuthenticated:', isAuthenticated);

  // If user is already authenticated, redirect to dashboard immediately
  if (isAuthenticated && user) {
    console.log('Index: User is authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading only if we're in the middle of an authentication process
  // (when there's a session being processed)
  if (loading && user === undefined) {
    console.log('Index: Showing loading state during auth process');
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // For all other cases (unauthenticated users, or no loading), show landing page immediately
  console.log('Index: Showing landing page');
  return <LandingPage />;
};

export default Index;
