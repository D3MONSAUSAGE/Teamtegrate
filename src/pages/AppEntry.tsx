
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AppEntry = () => {
  const { user, loading, isAuthenticated } = useAuth();

  console.log('AppEntry page - Loading:', loading, 'User:', !!user, 'IsAuthenticated:', isAuthenticated);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  // Redirect based on authentication status
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default AppEntry;
