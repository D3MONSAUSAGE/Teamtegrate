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
  const location = useLocation();
  const [navigationReady, setNavigationReady] = useState(false);
  const [stabilizationDelay, setStabilizationDelay] = useState(false);

  useEffect(() => {
    const isSafariDevice = isSafari() || isAppleDevice();
    
    if (!isSafariDevice) {
      // Non-Safari devices: navigate immediately
      setNavigationReady(true);
      return;
    }

    console.log('🍎 Safari Navigation Wrapper - Initializing for path:', location.pathname);
    console.log('🍎 Auth state:', { isAuthenticated, loading });

    // Safari-specific stabilization logic
    if (loading) {
      console.log('🍎 Safari: Auth still loading, waiting...');
      setNavigationReady(false);
      return;
    }

    if (!isAuthenticated) {
      console.log('🍎 Safari: Not authenticated, will redirect to login');
      setNavigationReady(true);
      return;
    }

    // Add small delay for Safari to ensure auth state is stable
    console.log('🍎 Safari: Adding stabilization delay for auth state...');
    setStabilizationDelay(true);
    
    const timer = setTimeout(() => {
      console.log('🍎 Safari: Stabilization complete, rendering page');
      setNavigationReady(true);
      setStabilizationDelay(false);
    }, 150); // Small delay to prevent race conditions

    return () => {
      clearTimeout(timer);
    };
  }, [isAuthenticated, loading, location.pathname]);

  // Show loading during stabilization for Safari
  if ((isSafari() || isAppleDevice()) && (loading || stabilizationDelay || !navigationReady)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading page...</p>
          {(isSafari() || isAppleDevice()) && (
            <p className="text-xs text-muted-foreground mt-2">Safari enhanced navigation</p>
          )}
        </div>
      </div>
    );
  }

  // Handle authentication redirect
  if (!isAuthenticated) {
    console.log('🍎 Safari: Redirecting to login due to missing authentication');
    return <Navigate to="/login" replace />;
  }

  // Render the actual content
  console.log('🍎 Safari: Rendering page content');
  return <>{children}</>;
};

export default SafariNavigationWrapper;