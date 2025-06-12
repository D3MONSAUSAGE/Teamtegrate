
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading, isAuthenticated } = useAuth();

  console.log('Index page - Loading:', loading, 'User:', !!user, 'IsAuthenticated:', isAuthenticated);

  // Show loading only briefly during auth initialization
  if (loading) {
    console.log('Index: Showing loading state');
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated && user) {
    console.log('Index: User is authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Show marketing landing page for non-authenticated users
  console.log('Index: Showing landing page for non-authenticated user');
  return <LandingPage />;
};

export default Index;
