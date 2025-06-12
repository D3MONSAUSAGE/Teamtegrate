
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading, isAuthenticated } = useAuth();

  console.log('Index page - Loading:', loading, 'User:', !!user, 'IsAuthenticated:', isAuthenticated);

  // Show loading only if we're actually in the process of checking auth
  // and we haven't determined the auth state yet
  if (loading) {
    console.log('Index: Showing loading state during auth check');
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
          <p className="text-xs text-muted-foreground mt-2">
            If this takes too long, please refresh the page
          </p>
        </div>
      </div>
    );
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

  // For all other cases (no auth loading, unauthenticated), show landing page
  console.log('Index: Showing landing page');
  return <LandingPage />;
};

export default Index;
