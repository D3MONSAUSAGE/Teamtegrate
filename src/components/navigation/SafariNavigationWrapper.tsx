import React, { useState, useEffect } from 'react';
import { isSafari, isAppleDevice } from '@/lib/browser';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface SafariNavigationWrapperProps {
  children: React.ReactNode;
}

const SafariNavigationWrapper: React.FC<SafariNavigationWrapperProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading only during auth initialization
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      </div>
    );
  }

  // Handle authentication redirect
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the actual content immediately - no delays or complex logic
  return <>{children}</>;
};

export default SafariNavigationWrapper;