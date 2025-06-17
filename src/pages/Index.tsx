
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

  // Show loading only during initial auth check when we don't know the auth state yet
  // This prevents infinite loading by only showing loading when we're actually checking auth
  if (loading) {
    console.log('Index: Showing loading state during auth initialization');
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
