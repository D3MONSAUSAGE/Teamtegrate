import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TrainingNavigationFixProps {
  children: React.ReactNode;
}

/**
 * Training Navigation Fix Component
 * Ensures training page navigation works without full app remount
 */
export const TrainingNavigationFix: React.FC<TrainingNavigationFixProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navigateToTraining = useCallback(() => {
    console.log('🚀 TrainingNavigationFix: Starting navigation to training');
    console.log('🚀 Current location:', location.pathname);
    
    try {
      // Prevent any potential state conflicts during navigation
      const targetPath = '/dashboard/training';
      
      if (location.pathname === targetPath) {
        console.log('🚀 Already on training page');
        return;
      }
      
      console.log('🚀 Navigating to:', targetPath);
      navigate(targetPath, { replace: false });
      
      // Fallback navigation if React Router fails
      setTimeout(() => {
        if (window.location.pathname !== targetPath) {
          console.log('🚀 Fallback navigation triggered');
          window.history.pushState(null, '', targetPath);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }, 100);
      
    } catch (error) {
      console.error('🔴 TrainingNavigationFix: Navigation error:', error);
      // Emergency fallback
      window.location.href = '/dashboard/training';
    }
  }, [navigate, location.pathname]);
  
  // Expose navigation function globally for emergency use
  React.useEffect(() => {
    (window as any).navigateToTraining = navigateToTraining;
    return () => {
      delete (window as any).navigateToTraining;
    };
  }, [navigateToTraining]);
  
  return <>{children}</>;
};

export default TrainingNavigationFix;