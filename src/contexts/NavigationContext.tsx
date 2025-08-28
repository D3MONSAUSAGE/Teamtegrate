import React, { createContext, useContext, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavigationContextType {
  isNavigating: boolean;
  safeNavigate: (path: string, options?: { replace?: boolean }) => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const safeNavigate = useCallback(async (path: string, options: { replace?: boolean } = {}) => {
    if (isNavigating) {
      console.log('🔄 Navigation already in progress, skipping');
      return;
    }
    
    console.log('🚀 SafeNavigate: Starting navigation to:', path);
    setIsNavigating(true);
    
    try {
      // Add small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 10));
      
      navigate(path, options);
      
      // Reset navigation state after successful navigation
      setTimeout(() => {
        setIsNavigating(false);
        console.log('🚀 SafeNavigate: Navigation completed');
      }, 100);
      
    } catch (error) {
      console.error('🔴 SafeNavigate: Navigation failed:', error);
      setIsNavigating(false);
      
      // Fallback navigation
      try {
        window.history.pushState(null, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (fallbackError) {
        console.error('🔴 SafeNavigate: Fallback also failed:', fallbackError);
        window.location.href = path;
      }
    }
  }, [navigate, isNavigating]);
  
  const value: NavigationContextType = {
    isNavigating,
    safeNavigate
  };
  
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};